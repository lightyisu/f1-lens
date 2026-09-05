import type { Metadata } from "next";
import { Archivo, JetBrains_Mono, Titillium_Web } from "next/font/google";
import "./globals.css";
import { getDictionary } from "@/lib/i18n";
import { LocaleProvider } from "@/components/LocaleProvider";
import LangSwitch from "@/components/LangSwitch";
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_DESCRIPTION_ZH,
  SITE_NAME,
} from "@/lib/seo";

/** 可变宽度黑体，拉到 Expanded，接近附图那种扁宽数字（官方 F1 字体不对外授权） */
const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
});

/** F1 品牌指南中用于长文的官方配套字体 */
const body = Titillium_Web({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "F1",
    "Formula 1",
    "F1 Lens",
    "race results",
    "qualifying",
    "F1 schedule",
    "lap times",
    "tyre strategy",
    "一级方程式",
    "F1赛程",
    "F1成绩",
  ],
  authors: [{ name: "lightyisu", url: "https://github.com/lightyisu" }],
  creator: "lightyisu",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: siteUrl,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/",
  },
  category: "sports",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, t } = await getDictionary();

  return (
    <html
      lang={locale === "zh" ? "zh-CN" : "en"}
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-h-dvh flex-col bg-[#eef2f6] font-sans">
        <LocaleProvider locale={locale}>
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: SITE_NAME,
                url: siteUrl,
                description: SITE_DESCRIPTION,
                inLanguage: ["en", "zh-CN"],
                alternateName: SITE_DESCRIPTION_ZH,
              }),
            }}
          />
          <footer className="border-t border-black/[0.06] py-6 px-4 sm:px-6">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3">
              <div className="flex items-center gap-4">
                <LangSwitch />
                <a
                  href="https://github.com/lightyisu/f1-lens"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="text-ink/70 hover:text-ink transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden
                    className="h-5 w-5"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577 0-.285-.01-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.467-1.332-5.467-5.93 0-1.31.468-2.382 1.236-3.222-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.655 1.653.243 2.873.12 3.176.77.84 1.235 1.912 1.235 3.222 0 4.61-2.807 5.624-5.48 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.902-.014 3.293 0 .32.216.694.825.576C20.565 21.796 24 17.297 24 12 24 5.37 18.627 0 12 0z" />
                  </svg>
                </a>
              </div>
              <p className="text-center text-[11px] sm:text-xs leading-relaxed text-muted">
                {t.footer}
              </p>
            </div>
          </footer>
        </LocaleProvider>
      </body>
    </html>
  );
}
