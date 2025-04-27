import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Code Onboarding Assistant",
  description: "AI-powered code walkthrough for easy onboarding to new codebases",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.className} antialiased min-h-screen bg-[#0D1117] text-[#C9D1D9] flex flex-col`}>
        <ThemeProvider>
          <main className="flex-grow">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
        
        <footer className="w-full sticky bottom-0 text-center p-3 text-xs text-[#6E7681] bg-[#161B22] border-t border-[#30363D] z-10">
          Created by 
          <Link href="https://x.com/createdbymason" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 mx-1">
            Mason
          </Link> 
          and 
          <Link href="https://x.com/aryanmparekh" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 mx-1">
            Aryan
          </Link>
        </footer>
      </body>
    </html>
  );
}
