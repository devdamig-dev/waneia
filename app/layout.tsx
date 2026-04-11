import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WANEIA",
  description: "Automatizá tu atención por WhatsApp y convertí más consultas en ventas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
