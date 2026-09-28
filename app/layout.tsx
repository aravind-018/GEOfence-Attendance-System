import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEOfence Attendance System",
  description: "QR-code + GPS geofenced employee attendance management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
