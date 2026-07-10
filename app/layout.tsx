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

// export const metadata: Metadata = {
//   title: "Tut-Dev",
//   description: "A platform for developers to share their knowledge and ideas. and Best possible read and go tutorials.",
// };


export const metadata: Metadata = {
  title: 'Tut-Dev | Production-Ready Development Tutorials',
  description: 'An optimized blogging platform for developers to share high-quality technical tutorials, MERN stack guides, hardware configurations, and optimization tips.',
  openGraph: {
    title: 'Tut-Dev | Engineering Tutorials Platform',
    description: 'An optimized blogging platform for developers to share high-quality technical tutorials.',
    url: 'https://tut-dev.vercel.app',
    siteName: 'Tut-Dev',
    images: [
      {
        url: 'https://tut-dev.vercel.app/main-og-cover.png', // Add a nice app overview image here later
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tut-Dev | Engineering Tutorials Platform',
    description: 'An optimized blogging platform for developers to share technical tricks.',
  },
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
