import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Samundra Drishti - Maritime Intelligence Portal",
  description: "National Maritime Surveillance and Coastal Intelligence System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
