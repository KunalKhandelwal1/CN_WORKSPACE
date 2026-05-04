import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import PageWrapper from "@/components/PageWrapper";

const jbMono = JetBrains_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
  title: "DRL-TCP Simulation Dashboard",
  description: "Deep Reinforcement Learning based TCP Congestion Control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jbMono.variable} font-sans`}>
        <NavBar />
        <PageWrapper>
          {children}
        </PageWrapper>
      </body>
    </html>
  );
}
