import type { Metadata } from "next";
import { Nunito, Playfair_Display } from "next/font/google";
import config from "./config";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  variable: "--font-nunito",
});
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
});
export const metadata: Metadata = {
  title: config.siteName,
  description: config.siteName,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${nunito.variable} ${playfair.variable} font-sans antialiased relative`}
      >
        {children}
      </body>
    </html>
  );
}
