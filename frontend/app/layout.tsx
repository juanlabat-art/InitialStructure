import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";
import { themeScript } from "./shared/theme";

const interfaceFont = localFont({
  src: "./fonts/dm-sans-latin.woff2",
  weight: "100 1000",
  variable: "--font-interface",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VoZero · Ideas sin eco",
  icons: { icon: { url: "/vozero-logo-mint-97ead2.png", type: "image/png" } },
  description:
    "Un foro de comunidades donde las ideas importan más que los nombres.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={interfaceFont.variable}>
        {children}
        <div id="toast-root" aria-live="polite" />
      </body>
    </html>
  );
}
