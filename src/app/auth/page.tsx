import { redirect } from "next/navigation";

export default function AuthPage() {
  // /auth is legacy. Redirect to the login page, which also links to signup.
  redirect("/login");
}
