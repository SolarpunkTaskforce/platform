import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import AuthButton from "@/components/AuthButton";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solarpunk Taskforce",
  description: "Coordination platform for humanitarian and environmental projects",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="flex items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-semibold">Solarpunk Taskforce</Link>
          <div className="flex items-center gap-4">
            {/* existing nav here */}
            <AuthButton />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
