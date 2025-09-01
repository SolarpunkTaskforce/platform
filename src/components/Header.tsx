import Link from "next/link";
import UserMenu from "@/components/UserMenu";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-3">
      <Link href="/" className="text-lg font-bold" aria-label="Home">
        Solarpunk
      </Link>
      <div className="flex items-center gap-4">
        <nav className="flex gap-4">
          <Link href="/" prefetch={false}>Home</Link>
          <Link href="/projects" prefetch={false}>Projects</Link>
        </nav>
        <UserMenu />
      </div>
    </header>
  );
}

