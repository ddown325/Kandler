import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kandler — 3D Modeling Suite | by Kantasu",
  description: "Kandler is a Three.js-powered 3D modeling suite with Blender-class capabilities. Modeled, sculpted, animated, rendered — in the browser. Installable to your device. Made by Kantasu.",
  keywords: ["Kandler", "Kantasu", "3D", "Blender", "Three.js", "WebGL", "Modeling", "Sculpting", "Animation", "PBR"],
  authors: [{ name: "Kantasu" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    shortcut: ["/favicon.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Kandler",
    statusBarStyle: "black-translucent",
  },
  applicationName: "Kandler",
  openGraph: {
    title: "Kandler — 3D Modeling Suite",
    description: "A Three.js-powered 3D modeling suite with Blender-class capabilities. Made by Kantasu.",
    siteName: "Kandler",
    type: "website",
    images: [{ url: "/icon.png", width: 1280, height: 1280 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kandler — 3D Modeling Suite",
    description: "Blender-class 3D modeling in the browser. Made by Kantasu.",
    images: ["/icon.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#e08a3c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.__kandlerInstallPrompt = e;
                window.dispatchEvent(new CustomEvent('kandler-installable'));
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
