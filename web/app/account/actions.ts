"use server";

import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function deleteAccountAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account/sign-in");
  }

  const admin = await createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(`Account deletion failed: ${error.message}`);
  }

  await supabase.auth.signOut();
  redirect("/?account_deleted=1");
}
