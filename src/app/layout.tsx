import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { ProgressProvider } from "@/components/progress";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Journaley",
  description: "A private journal for your own days.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`}>
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
