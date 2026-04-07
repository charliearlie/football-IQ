#!/bin/bash
# Seed Who's That? + Higher/Lower puzzles for today's date so home screen shows the cards.
# Requires FOOTBALL_IQ_API_SECRET env var.
#
# Usage:
#   bash seed-puzzles.sh              # uses localhost:3000 (safe, local only)
#   bash seed-puzzles.sh production   # uses production API (affects real users!)

set -euo pipefail

TODAY=$(date +%Y-%m-%d)

if [ "${1:-}" = "production" ]; then
  API_URL="https://www.football-iq.app/api/puzzles"
  echo "⚠️  Targeting PRODUCTION database"
else
  API_URL="http://localhost:3000/api/puzzles"
  echo "Targeting localhost:3000 (pass 'production' arg to target prod)"
fi

if [ -z "${FOOTBALL_IQ_API_SECRET:-}" ]; then
  echo "Error: FOOTBALL_IQ_API_SECRET is not set"
  exit 1
fi

echo "Seeding puzzles for $TODAY..."

# Who's That? puzzle
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API_URL" \
  -H "Authorization: Bearer $FOOTBALL_IQ_API_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"puzzle_date\":\"$TODAY\",\"game_mode\":\"whos-that\",\"status\":\"live\",\"source\":\"manual\",\"content\":{\"answer\":{\"player_name\":\"Bukayo Saka\",\"player_id\":\"Q59306386\",\"club\":\"Arsenal\",\"league\":\"Premier League\",\"nationality\":\"England\",\"position\":\"Forward\",\"birth_year\":2001,\"age\":24}}}")

if [ "$HTTP_CODE" -ge 400 ]; then
  echo "Error: Who's That? seed failed with HTTP $HTTP_CODE"
  exit 1
fi
echo "Who's That? puzzle seeded (HTTP $HTTP_CODE)"

# Higher/Lower puzzle (chain format — 11 players, each round compares [N] vs [N+1])
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API_URL" \
  -H "Authorization: Bearer $FOOTBALL_IQ_API_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"puzzle_date\":\"$TODAY\",\"game_mode\":\"higher_lower\",\"status\":\"live\",\"source\":\"manual\",\"content\":{\"players\":[{\"name\":\"Neymar\",\"club\":\"PSG\",\"fee\":222},{\"name\":\"Mbappe\",\"club\":\"Real Madrid\",\"fee\":180},{\"name\":\"Coutinho\",\"club\":\"Barcelona\",\"fee\":135},{\"name\":\"Pogba\",\"club\":\"Man United\",\"fee\":105},{\"name\":\"Hazard\",\"club\":\"Real Madrid\",\"fee\":115},{\"name\":\"Griezmann\",\"club\":\"Barcelona\",\"fee\":120},{\"name\":\"Joao Felix\",\"club\":\"Atletico\",\"fee\":127},{\"name\":\"Lukaku\",\"club\":\"Chelsea\",\"fee\":97.5},{\"name\":\"Grealish\",\"club\":\"Man City\",\"fee\":100},{\"name\":\"Haaland\",\"club\":\"Man City\",\"fee\":60},{\"name\":\"Nunez\",\"club\":\"Liverpool\",\"fee\":85}],\"pairs\":[{\"player1\":{\"name\":\"Neymar\",\"club\":\"PSG\",\"fee\":222},\"player2\":{\"name\":\"Mbappe\",\"club\":\"Real Madrid\",\"fee\":180}}]}}")

if [ "$HTTP_CODE" -ge 400 ]; then
  echo "Error: Higher/Lower seed failed with HTTP $HTTP_CODE"
  exit 1
fi
echo "Higher/Lower puzzle seeded (HTTP $HTTP_CODE)"

echo "Done! All puzzles seeded for $TODAY"
