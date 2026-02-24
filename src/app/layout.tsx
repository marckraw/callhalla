import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Toaster } from "@/shared";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Callhalla",
  description: "API request workbench for endpoint testing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={spaceGrotesk.className} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
