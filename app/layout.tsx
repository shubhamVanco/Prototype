import type { Metadata, Viewport } from "next";
import "@fontsource/barlow-semi-condensed/600.css";
import "@fontsource/barlow-semi-condensed/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "TyreVision AI",
  description: "AI-powered tyre pre-inspection",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f0eb" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f11" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=JSON.parse(localStorage.getItem("tvai.settings.v2")||"{}");document.documentElement.dataset.theme=s.theme==="light"?"light":"dark"}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
