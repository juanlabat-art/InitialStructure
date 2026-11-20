import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoZero · Ideas sin eco",
  icons: { icon: { url: "/vozero-logo.jpg", type: "image/jpeg" } },
  description:
    "Un foro de comunidades donde las ideas importan más que los nombres.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        {children}
        <div id="toast-root" aria-live="polite" />
      </body>
    </html>
  );
}
