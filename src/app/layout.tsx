import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solarpunk Taskforce",
  description: "A global platform for humanitarian and environmental impact",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="fixed top-0 inset-x-0 z-50 h-14 bg-white/90 backdrop-blur border-b border-gray-200">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
            <Link href="/" className="font-bold text-lg">
              Solarpunk Taskforce
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
              <Link href="/projects">Find Projects</Link>
              <Link href="/organisations">Find Organisations</Link>
              <Link href="/feed">Feed</Link>
              <Link href="/note-empathy">Note Empathy</Link>
              <Link href="/services">Services</Link>
            </nav>
          </div>
        </header>
        <main className="pt-14 min-h-screen">{children}</main>
      </body>
    </html>
  );
}

