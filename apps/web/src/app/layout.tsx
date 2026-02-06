import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "@/components/SupabaseProvider";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "בית — ניהול משק בית חכם",
  description: "אפליקציית ניהול משימות משק בית לזוגות",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "בית" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f59e0b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-sans bg-stone-50 text-stone-900 antialiased min-h-dvh">
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
