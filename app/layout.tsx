import type { Metadata } from "next";
import { Baloo_2, Nunito, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fresitteDisplay = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fresitte-display",
});

const fresitteSans = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fresitte-sans",
});

const fresitteMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-fresitte-mono",
});

export const metadata: Metadata = {
  title: "Fresitte | Moda infantil con amor",
  description:
    "Ecommerce boutique para bebés y niños: prendas orgánicas, colores vibrantes y cariño en cada envío.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fresitteDisplay.variable} ${fresitteSans.variable} ${fresitteMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
