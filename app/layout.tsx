import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marianela Team Board",
  description: "Monthly sales goals and production for the team",
  applicationName: "Marianela Team Board",
  icons: {
    icon: [{ url: "/icon?brand=mt&v=2", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon?brand=mt&v=2", type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Marianela Team Board", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ec0c21",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
