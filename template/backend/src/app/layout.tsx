import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homesure - Real Estate Marketplace",
  description: "Philippine real estate marketplace with instant payments and verified titles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
