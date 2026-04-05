/**
 * Player data refresh cron — keeps career data and club leagues up to date.
 *
 * Runs biweekly (1st and 15th of each month) and:
 * 0. Verifies current clubs for 50 mapped players via API-Football
 * 1. Refreshes career data for 40 players (stalest first, scout_rank >= 20)
 * 2. Backfills league data for 250 clubs missing it
 * 3. Bumps elite index version so mobile clients sync
 *
 * Schedule: 0 3 1,15 * * (3am UTC on 1st and 15th)
 * Configure in vercel.json:
 *   { "path": "/api/cron/player-refresh", "schedule": "0 3 1,15 * *" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateCronSecret } from "@/lib/push";
import {
  fetchPlayerCareer,
  fetchClubLeagues,
  saveCareerToSupabase,
  updateClubLeagues,
  markCareerRefreshed,
  sleep,
} from "@/lib/wikidata";
import {
  fetchPlayerTeams,
  apiTeamsToClubSummaries,
  DELAY_BETWEEN_REQUESTS_MS,
} from "@/lib/data-pipeline/map-external-ids";

export const runtime = "nodejs";
export const maxDuration = 300;

const API_FOOTBALL_BATCH_SIZE = 50;
const CAREER_BATCH_SIZE = 40;
const LEAGUE_BATCH_SIZE = 50;
const LEAGUE_BATCHES = 5;
const SPARQL_DELAY_MS = 6000;
const SAFETY_TIMEOUT_MS = 270_000; // Stop 30s before maxDuration

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = await createAdminClient();
  const logs: string[] = [];
  let careersRefreshed = 0;
  let careersSkipped = 0;
  let careersFailed = 0;
  let leaguesUpdated = 0;
  let clubsVerified = 0;
  let mismatchesFound = 0;

  // ── Phase 0: API-Football club verification ───────────────────────────────

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (apiKey) {
    try {
      const threeMonthsAgo = new Date(
        Date.now() - 90 * 24 * 60 * 60 * 1000,
      ).toISOString();

      // Get mapped players needing verification
      const { data: playersToCheck, error: checkErr } = await supabase
        .from("players")
        .select("id, name, api_football_id")
        .not("api_football_id", "is", null)
        .or(`verified_at.is.null,verified_at.lt.${threeMonthsAgo}`)
        .gte("scout_rank", 10)
        .order("scout_rank", { ascending: false })
        .limit(API_FOOTBALL_BATCH_SIZE);

      if (checkErr) {
        logs.push(`[verify] DB query error: ${checkErr.message}`);
      } else if (playersToCheck && playersToCheck.length > 0) {
        logs.push(`[verify] Checking ${playersToCheck.length} players via API-Football`);

        for (const p of playersToCheck) {
          if (Date.now() - startTime > SAFETY_TIMEOUT_MS) break;

          try {
            const teams = await fetchPlayerTeams(p.api_football_id!, apiKey);
            const clubs = apiTeamsToClubSummaries(teams);

            // Get the most recent club (highest max season year)
            const currentApiClub = clubs.length > 0
              ? clubs.reduce((best, c) =>
                  c.endYear > best.endYear ? c : best
                )
              : null;

            // Get our current club
            const { data: ourAppearance } = await supabase
              .from("player_appearances")
              .select("club_id, clubs(name, league)")
              .eq("player_id", p.id)
              .is("end_year", null)
              .order("start_year", { ascending: false })
              .limit(1)
              .single();

            const ourClub = ourAppearance?.clubs as { name: string; league: string | null } | null;

            if (!currentApiClub) {
              // No API data — skip
              await sleep(DELAY_BETWEEN_REQUESTS_MS);
              continue;
            }

            // Compare: normalize names for fuzzy match
            const normalize = (s: string) =>
              s.toLowerCase().replace(/[^a-z0-9]/g, "");
            const apiName = normalize(currentApiClub.clubName);
            const ourName = ourClub ? normalize(ourClub.name) : "";

            const isMatch =
              ourName === apiName ||
              apiName.includes(ourName) ||
              ourName.includes(apiName);

            if (isMatch && ourClub) {
              // Match — auto-verify
              await supabase
                .from("players")
                .update({
                  verified_at: new Date().toISOString(),
                  verified_club: ourClub.name,
                  verified_league: ourClub.league,
                })
                .eq("id", p.id);
              clubsVerified++;
            } else {
              // Mismatch — log for admin review
              await supabase.from("club_mismatches").insert({
                player_id: p.id,
                our_club_name: ourClub?.name ?? "(none)",
                api_club_name: currentApiClub.clubName,
                api_club_id: currentApiClub.apiClubId,
              });
              mismatchesFound++;
              logs.push(
                `[verify] Mismatch: ${p.name} — ours: ${ourClub?.name ?? "none"}, API: ${currentApiClub.clubName}`,
              );
            }
          } catch (err) {
            logs.push(
              `[verify] Error ${p.name}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }

          await sleep(DELAY_BETWEEN_REQUESTS_MS);
        }
      }
    } catch (err) {
      logs.push(
        `[verify] Fatal: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  } else {
    logs.push("[verify] Skipped — API_FOOTBALL_KEY not configured");
  }

  // ── Phase 1: Refresh careers for top players ──────────────────────────────

  try {
    // Select players with scout_rank >= 20, stalest refresh first
    // career_refreshed_at added after types were generated — cast column name
    const { data: players, error: pErr } = await supabase
      .from("players")
      .select("id, name, scout_rank")
      .gte("scout_rank", 20)
      .order("career_refreshed_at", { ascending: true, nullsFirst: true })
      .limit(CAREER_BATCH_SIZE);

    if (pErr) {
      logs.push(`[careers] DB query error: ${pErr.message}`);
    } else if (players && players.length > 0) {
      logs.push(`[careers] Processing ${players.length} players`);

      for (const player of players) {
        if (Date.now() - startTime > SAFETY_TIMEOUT_MS) {
          logs.push(`[careers] Safety timeout after ${careersRefreshed} refreshed`);
          break;
        }

        try {
          const career = await fetchPlayerCareer(player.id);

          if (career.length === 0) {
            careersSkipped++;
            await markCareerRefreshed(player.id);
            await sleep(SPARQL_DELAY_MS);
            continue;
          }

          // Regression guard: check existing appearance count
          const { count: existingCount } = await supabase
            .from("player_appearances")
            .select("*", { count: "exact", head: true })
            .eq("player_id", player.id);

          if (
            existingCount &&
            existingCount > 2 &&
            career.length < existingCount * 0.5
          ) {
            logs.push(
              `[careers] Skipped ${player.name}: new ${career.length} vs existing ${existingCount} (regression guard)`,
            );
            careersSkipped++;
            await markCareerRefreshed(player.id);
            await sleep(SPARQL_DELAY_MS);
            continue;
          }

          const saveResult = await saveCareerToSupabase(player.id, career);
          if (saveResult.success) {
            careersRefreshed++;
            await markCareerRefreshed(player.id);
          } else {
            careersFailed++;
            logs.push(
              `[careers] Failed ${player.name}: ${saveResult.error}`,
            );
          }
        } catch (err) {
          careersFailed++;
          logs.push(
            `[careers] Error ${player.name}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }

        await sleep(SPARQL_DELAY_MS);
      }
    }
  } catch (err) {
    logs.push(
      `[careers] Fatal: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // ── Phase 2: Backfill club leagues ────────────────────────────────────────

  try {
    if (Date.now() - startTime < SAFETY_TIMEOUT_MS) {
      // Get clubs missing league data (league added after types generated)
      const { data: clubs, error: cErr } = await supabase
        .from("clubs")
        .select("id")
        .is("league", null)
        .limit(LEAGUE_BATCH_SIZE * LEAGUE_BATCHES);

      if (cErr) {
        logs.push(`[leagues] DB query error: ${cErr.message}`);
      } else if (clubs && clubs.length > 0) {
        logs.push(`[leagues] Processing ${clubs.length} clubs`);

        for (let i = 0; i < clubs.length; i += LEAGUE_BATCH_SIZE) {
          if (Date.now() - startTime > SAFETY_TIMEOUT_MS) break;

          const batch = clubs.slice(i, i + LEAGUE_BATCH_SIZE);
          const qids = batch.map((c) => c.id);

          try {
            const results = await fetchClubLeagues(qids);
            const { updated } = await updateClubLeagues(results);
            leaguesUpdated += updated;
          } catch (err) {
            logs.push(
              `[leagues] Batch error: ${err instanceof Error ? err.message : String(err)}`,
            );
          }

          await sleep(SPARQL_DELAY_MS);
        }
      }
    }
  } catch (err) {
    logs.push(
      `[leagues] Fatal: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // ── Phase 3: Bump elite index version ─────────────────────────────────────

  if (careersRefreshed > 0) {
    const { error: bumpError } = await supabase.rpc(
      "bump_elite_index_version",
    );
    if (bumpError) {
      logs.push(`[sync] Version bump failed: ${bumpError.message}`);
    }
  }

  // ── Phase 4: Log to agent_runs ────────────────────────────────────────────

  try {
    await supabase.from("agent_runs").insert({
      run_date: new Date().toISOString().split("T")[0],
      agent_name: "player_refresh_cron",
      status: careersFailed > 0 ? "partial" : "success",
      puzzles_created: 0,
      logs: {
        clubs_verified: clubsVerified,
        mismatches_found: mismatchesFound,
        careers_refreshed: careersRefreshed,
        careers_skipped: careersSkipped,
        careers_failed: careersFailed,
        leagues_updated: leaguesUpdated,
        duration_ms: Date.now() - startTime,
        messages: logs,
      },
    });
  } catch {
    // Non-critical
  }

  return NextResponse.json({
    message: "Player refresh complete",
    verification: { verified: clubsVerified, mismatches: mismatchesFound },
    careers: { refreshed: careersRefreshed, skipped: careersSkipped, failed: careersFailed },
    leagues: { updated: leaguesUpdated },
    duration_ms: Date.now() - startTime,
    logs,
  });
}
