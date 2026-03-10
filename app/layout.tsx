import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dorm Basketball Board",
  description: "Shared weekly basketball reservation board for a dorm community."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
