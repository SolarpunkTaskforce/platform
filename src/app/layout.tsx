import "./globals.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"; // global CSS from node_modules must be here

import type { Metadata } from "next";
import { ReactNode } from "react";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Solarpunk Taskforce",
  description: "Coordination platform for humanitarian and environmental projects",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Header />
        {children}
      </body>
    </html>
  );
}