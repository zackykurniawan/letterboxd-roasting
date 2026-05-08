import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Roast My Letterboxd — AI Roasting Film Anda",
  description:
    "Masukkan username Letterboxd-mu. AI kami akan menganalisis selera filmmu... dan menertawakannya. Powered by Google Gemini.",
  openGraph: {
    title: "Roast My Letterboxd",
    description: "Kami analisis selera filmmu, lalu menertawakannya. 🎬🔥",
    type: "website",
    images: [{ url: "/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roast My Letterboxd",
    description: "Kami analisis selera filmmu, lalu menertawakannya. 🎬🔥",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${playfair.variable} dark`}
    >
      <body className="min-h-screen flex flex-col animated-bg antialiased">
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
