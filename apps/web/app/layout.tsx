import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quote Lab | Mercurius University",
  description: "Build clear, accurate Mercurius quotes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
