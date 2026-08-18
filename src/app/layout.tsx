import type { Metadata } from "next";
import { Baloo_2, Geist } from "next/font/google";
import Image from "next/image";

import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const appFont = Baloo_2({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "MenuKita",
  description: "AI food compatibility for groups navigating unfamiliar menus.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={appFont.className}>
        <Image
          src="/menukita-logo-transparent.png"
          alt="MenuKita"
          width={600}
          height={295}
          priority
          className="pointer-events-none fixed left-3 top-3 z-50 h-11 w-auto drop-shadow-[0_5px_10px_rgba(80,35,10,0.2)] sm:left-5 sm:top-4 sm:h-14"
        />
        {children}
      </body>
    </html>
  );
}
