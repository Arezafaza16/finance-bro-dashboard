import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7c3aed",
};

export const metadata: Metadata = {
  title: {
    default: "Finance-Bro - Dashboard Keuangan UMKM",
    template: "%s | Finance-Bro",
  },
  description: "Aplikasi dashboard keuangan untuk UMKM Indonesia. Kelola pemasukan, pengeluaran, produk, dan bahan baku dengan mudah. Gratis dan aman.",
  keywords: [
    "dashboard keuangan",
    "UMKM",
    "aplikasi keuangan",
    "manajemen keuangan",
    "pembukuan",
    "laporan keuangan",
    "Indonesia",
    "bisnis kecil",
    "finance dashboard",
  ],
  authors: [{ name: "Finance-Bro Team" }],
  creator: "Finance-Bro",
  publisher: "Finance-Bro",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Finance-Bro",
    title: "Finance-Bro - Dashboard Keuangan UMKM",
    description: "Aplikasi dashboard keuangan untuk UMKM Indonesia. Kelola pemasukan, pengeluaran, produk, dan bahan baku dengan mudah.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Finance-Bro - Dashboard Keuangan UMKM",
    description: "Aplikasi dashboard keuangan untuk UMKM Indonesia.",
  },
  category: "finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

