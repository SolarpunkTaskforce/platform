import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const emailOne = process.env.SUPABASE_TEST_EMAIL_1 || "";
const passwordOne = process.env.SUPABASE_TEST_PASSWORD_1 || "";
const emailTwo = process.env.SUPABASE_TEST_EMAIL_2 || "";
const passwordTwo = process.env.SUPABASE_TEST_PASSWORD_2 || "";

function requireEnv(value: string, name: string) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function signIn(email: string, password: string) {
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const { data } = await client.auth.getUser();
  if (!data.user) throw new Error("Missing user after sign-in.");

  return { client, user: data.user };
}

async function main() {
  requireEnv(supabaseUrl, "SUPABASE_URL");
  requireEnv(supabaseAnonKey, "SUPABASE_ANON_KEY");
  requireEnv(emailOne, "SUPABASE_TEST_EMAIL_1");
  requireEnv(passwordOne, "SUPABASE_TEST_PASSWORD_1");
  requireEnv(emailTwo, "SUPABASE_TEST_EMAIL_2");
  requireEnv(passwordTwo, "SUPABASE_TEST_PASSWORD_2");

  const { client: clientOne, user: userOne } = await signIn(emailOne, passwordOne);
  const { client: clientTwo, user: userTwo } = await signIn(emailTwo, passwordTwo);

  console.log("Signed in test users.");

  const { data: created, error: insertError } = await clientOne
    .from("follow_edges")
    .insert({
      follower_user_id: userOne.id,
      target_type: "person",
      target_person_id: userTwo.id,
    })
    .select("id")
    .maybeSingle();

  if (insertError) throw insertError;
  if (!created?.id) throw new Error("Follow edge insert failed.");

  console.log("Inserted follow edge.");

  const { data: forbiddenInsert, error: forbiddenError } = await clientOne
    .from("follow_edges")
    .insert({
      follower_user_id: userTwo.id,
      target_type: "person",
      target_person_id: userOne.id,
    })
    .select("id")
    .maybeSingle();

  if (!forbiddenError) {
    throw new Error(
      `Expected forbidden insert for mismatched follower_user_id, got ${forbiddenInsert?.id ?? "success"}.`
    );
  }

  console.log("Blocked mismatched follower insert as expected.");

  const { data: blockedDelete, error: blockedDeleteError } = await clientTwo
    .from("follow_edges")
    .delete()
    .eq("id", created.id)
    .select("id")
    .maybeSingle();

  if (blockedDeleteError) throw blockedDeleteError;
  if (blockedDelete?.id) {
    throw new Error("Expected RLS to block delete by non-owner.");
  }

  console.log("Blocked delete by non-owner.");

  const { data: allowedDelete, error: allowedDeleteError } = await clientOne
    .from("follow_edges")
    .delete()
    .eq("id", created.id)
    .select("id")
    .maybeSingle();

  if (allowedDeleteError) throw allowedDeleteError;
  if (!allowedDelete?.id) throw new Error("Owner delete did not return row.");

  console.log("Owner delete succeeded.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
