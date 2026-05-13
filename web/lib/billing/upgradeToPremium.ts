/**
 * Calls the `upgrade_to_premium` SECURITY DEFINER RPC.
 *
 * Mirrors the mobile pattern (`src/features/auth/services/SubscriptionSync.ts`):
 * after RC confirms a purchase locally, we flip the Supabase mirror so server
 * components and other tables see the user as premium without waiting on a
 * webhook. The RPC is idempotent and only writes `auth.uid()`'s own row.
 *
 * Typed loosely because the generated `Database` types don't enumerate this
 * RPC, so a strict `SupabaseClient<Database>` parameter would force every call
 * site to import the same typed client.
 */
type RpcResult = { data: unknown; error: { message: string } | null };

export async function upgradeToPremium(supabase: {
  rpc: (...args: unknown[]) => PromiseLike<RpcResult>;
}): Promise<{ ok: boolean; error: string | null }> {
  const { data, error } = await supabase.rpc("upgrade_to_premium");

  if (error) {
    return { ok: false, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const profile = row as { is_premium?: boolean } | null;
  if (!profile?.is_premium) {
    return { ok: false, error: "upgrade_to_premium returned non-premium profile" };
  }

  return { ok: true, error: null };
}
