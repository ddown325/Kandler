import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Kandler — 3D Modeling in your Browser | by KANTASU",
  description: "Kandler is a Blender-like 3D modeling editor built with Three.js. Created by KANTASU. Installable for offline use.",
  keywords: ["Kandler", "3D editor", "Blender alternative", "Three.js", "web 3D", "PWA", "KANTASU"],
  authors: [{ name: "KANTASU" }],
  applicationName: "Kandler 3D by KANTASU",
  manifest: "manifest.webmanifest",
  icons: {
    icon: [
      { url: "favicon.png", sizes: "128x128", type: "image/png" },
      { url: "icons/kandler-192.png", sizes: "192x192", type: "image/png" },
      { url: "icons/kandler-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "icons/kandler-180.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "favicon.png", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kandler",
  },
  openGraph: {
    title: "Kandler — 3D Modeling in your Browser",
    description: "Blender-like 3D editor with Three.js. Created by KANTASU.",
    type: "website",
    images: [{ url: "icons/kandler-512.png", width: 512, height: 512, alt: "Kandler" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kandler — 3D Modeling in your Browser",
    description: "Blender-like 3D editor with Three.js. Created by KANTASU.",
    images: ["icons/kandler-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="manifest" href="manifest.webmanifest" />
        <link rel="icon" href="favicon.png" type="image/png" />
        <link rel="shortcut icon" href="favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="icons/kandler-180.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="icons/kandler-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="icons/kandler-512.png" />
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <SonnerToaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#1a0e2e",
              border: "1px solid rgba(168,85,247,0.4)",
              color: "#e9d5ff",
            },
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { var swPath = (window.location.pathname.replace(/\\/[^\\/]*$/, '') || '') + '/sw.js'; navigator.serviceWorker.register(swPath).catch(() => {}); }); }`,
          }}
        />
      </body>
    </html>
  );
}
