import type { Metadata } from "next";
import { Geist, Open_Sans } from "next/font/google";

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
          backgroundImage: "url(/food-pattern-joined.jpg)",
          backgroundRepeat: "repeat-y",
          backgroundSize: "100% auto",
          backgroundPosition: "top center",
        }}
      >
        {children}
      </body>
    </html>
  );
}
