import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PromptGPT — AI Image Prompt Library",
    template: "%s | PromptGPT",
  },
  description:
    "Browse, search, and copy thousands of AI image prompts organized by category. Find the perfect prompt for Midjourney, DALL-E, Stable Diffusion and more.",
  keywords: ["AI prompts", "image generation", "Midjourney prompts", "DALL-E prompts", "stable diffusion"],
  openGraph: {
    title: "PromptGPT — AI Image Prompt Library",
    description: "Browse and copy AI image prompts organized by category.",
    type: "website",
    siteName: "PromptGPT",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptGPT — AI Image Prompt Library",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased min-h-screen bg-[#0a0a0a]`}>
        <Navbar />
        <main className="pt-16">{children}</main>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              border: "1px solid #27272a",
              color: "#fafafa",
            },
          }}
        />
      </body>
    </html>
  );
}
