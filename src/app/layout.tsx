import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: "Jordan Create OS",
  description:
    "Operations, Content, Experience and Public Relations for Jordan Create.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="lg:flex">
          <Sidebar />
          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 lg:py-10">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
