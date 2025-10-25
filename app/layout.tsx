import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web IDE",
  description: "A VS Code-like web IDE with GitHub integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
