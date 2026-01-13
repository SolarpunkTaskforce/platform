// src/app/layout.tsx
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "react-day-picker/dist/style.css";

import type { Metadata } from "next";
import { ReactNode } from "react";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Solarpunk Taskforce",
  description: "Coordination platform for humanitarian and environmental projects",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-[100dvh] flex flex-col">
        <Header />
        {/* This is the critical container that provides a real height */}
        <div className="flex-1 min-h-0 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
