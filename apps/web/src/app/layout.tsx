import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { IntlWrapper } from "@/components/IntlWrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDD Ukraine — Traffic Rules Trainer",
  description: "Practice Ukrainian traffic rules (PDD) with exam simulation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${geistSans.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* Ambient tropical glow */}
        <div className="glow-ambient bg-teal-400 left-[-200px] top-[-100px]" />
        <div className="glow-ambient bg-emerald-500 right-[-200px] bottom-[30%]" />
        <div className="glow-ambient bg-cyan-400 left-[40%] bottom-[-200px]" />
        <IntlWrapper>
          <ThemeProvider>
            <Header />
            <main className="relative z-10 flex-1">{children}</main>
            <Footer />
          </ThemeProvider>
        </IntlWrapper>
      </body>
    </html>
  );
}
