import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bronco Repair Desk",
  description: "Sustainable Campus Life, Made Practical. Trade items with fellow students or get a repair verdict for your broken essentials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
