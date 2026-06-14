import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BlogProvider} from '@/context/BlogContext'
import Navbar from "@/components/layout/Navbar";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tut-Dev",
  description: "A platform for developers to share their knowledge and ideas. and Best possible read and go tutorials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <SessionProvider>
        <BlogProvider>
          <body className="min-h-full flex flex-col">
            <Toaster position="bottom-right" richColors />
            <Navbar />
            {children}
          </body>
        </BlogProvider>
      </SessionProvider>
    </html>
  );
}
