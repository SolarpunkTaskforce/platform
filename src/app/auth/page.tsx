import { redirect } from "next/navigation";

export default function AuthPage() {
  // /auth is legacy. We now use /signup for registration flows.
  // Keep /auth as the entry-point, but send people to the new system.
  redirect("/signup");
}
