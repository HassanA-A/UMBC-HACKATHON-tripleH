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

export const metadata = {
  title: "Interview Bot",
  description: "Interview prep and resume refinement",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Explicit favicon link (make sure the file exists in /public) */}
        <link rel="icon" href="/favicon-classic.ico?v=7" />
        {/* If you want to try another variant, swap the filename */}
        {/* <link rel="icon" href="/favicon-32only.ico?v=7" /> */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
