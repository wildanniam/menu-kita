import type { Metadata } from "next";
import { Geist, Open_Sans } from "next/font/google";
import Image from "next/image";

import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const appFont = Open_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "MenuKita",
  description: "AI food compatibility for groups navigating unfamiliar menus.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body
        className={appFont.className}
        style={{
          backgroundImage: "url(/food-pattern.jpg)",
          backgroundRepeat: "repeat",
          backgroundSize: "260px 260px",
        }}
      >
        <Image
          src="/menukita-logo-transparent.png"
          alt="MenuKita"
          width={210}
          height={104}
          priority
          className="fixed top-3 left-3 z-50 h-10 w-auto sm:h-12"
        />
        {children}
      </body>
    </html>
  );
}
