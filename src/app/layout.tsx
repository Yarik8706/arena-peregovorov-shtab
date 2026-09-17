import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Переговорный штаб · Arena",
  description: "Симулятор переговоров с ИИ-оппонентом и внутренним советником",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <header className="sticky top-0 z-20 border-b border-[var(--card-border)] bg-[var(--card)]/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              ⚔️ Переговорный штаб
            </Link>
            <nav className="flex gap-3 text-sm text-[var(--muted)]">
              <Link href="/" className="transition hover:text-white">
                Играть
              </Link>
              <Link href="/admin" className="transition hover:text-white">
                Админ
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
