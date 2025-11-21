import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavigationSidebar } from "@/components/navigation-sidebar";
import { GlobalFilterProvider } from "@/contexts/global-filter-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rabz Hit List",
  description: "Discover and showcase exceptional talent through innovative challenges and projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalFilterProvider>
          <NavigationSidebar>
            {children}
          </NavigationSidebar>
        </GlobalFilterProvider>
      </body>
    </html>
  );
}
