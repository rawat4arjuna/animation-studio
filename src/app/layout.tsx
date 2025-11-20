
// "use client"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { ApolloWrapper } from "@/lib/apollo-provider";
import Provider from "./SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Animotion",
  description: "Create stop-motion animations with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </Provider>
        <Toaster />
      </body>
    </html>
  );
}
