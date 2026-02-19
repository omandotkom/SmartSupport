import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartSupport",
  description: "Application Support Chat dengan Knowledge Base RAG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
