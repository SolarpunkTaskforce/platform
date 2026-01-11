import { notFound } from "next/navigation";

import { getServerSupabase } from "@/lib/supabaseServer";
import NotificationsClient, { type NotificationItem } from "./NotificationsClient";

async function markNotificationRead(id: string) {
  "use server";

  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("mark_notification_read", { nid: id });

  if (error) {
    throw new Error(error.message ?? "Unable to mark notification read.");
  }
}

async function markAllNotificationsRead() {
  "use server";

  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("mark_all_notifications_read");

  if (error) {
    throw new Error(error.message ?? "Unable to mark notifications read.");
  }
}

export default async function NotificationsPage() {
  const supabase = await getServerSupabase();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth?.user) {
    notFound();
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id,type,title,body,href,created_at,read_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message ?? "Unable to load notifications.");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <NotificationsClient
        notifications={(notifications ?? []) as NotificationItem[]}
        markNotificationRead={markNotificationRead}
        markAllNotificationsRead={markAllNotificationsRead}
      />
    </main>
  );
}
