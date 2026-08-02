import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { RegisterServiceWorker } from "./register-service-worker";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "SIMASET SD — Sistem Inventaris Aset Sekolah",
  description: "Aplikasi pengelolaan aset dan inventaris barang untuk sekolah dasar.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SIMASET SD",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f4b43",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Set tema SEBELUM paint pertama supaya nggak ada flash putih
            sebelum berubah ke gelap (FOUC). Baca localStorage; kalau
            belum pernah diset, ikut preferensi OS. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("simaset-tema");var g=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(g)document.documentElement.classList.add("dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
