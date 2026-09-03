import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/lib/context/settings-context";
import { AlertsProvider } from "@/lib/context/alerts-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Trading Pro — Análisis Cuantitativo, Señales & Backtesting",
  description:
    "Plataforma Micro SaaS para análisis cuantitativo de Criptomonedas, Acciones y ETFs con gráficos TradingView, señales y motor de backtesting con fricción real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans transition-colors duration-200">
        <SettingsProvider>
          <AlertsProvider>{children}</AlertsProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
