import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "TB Rewards",
  description: "Recognize great work. Redeem points for rewards.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
