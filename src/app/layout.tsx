import type React from "react";
import type { Metadata } from "next";
import { createElement } from "react";
import { UserConfigProvider } from "@/lib/user-config/context";
import { readUserConfig } from "@/lib/user-config/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Permanence — Infinite Canvas",
  description: "An infinite canvas for your taste, memory, and creative encounters. Ingest URLs, notes, and media through luminous ports.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userConfig = await readUserConfig();

  return (
    <html lang="en">
      <head>
        {createElement("link", {
          "data-user-overrides": "true",
          href: "/user-overrides.css",
          rel: "stylesheet",
        })}
      </head>
      <body>
        <UserConfigProvider config={userConfig}>{children}</UserConfigProvider>
      </body>
    </html>
  );
}
