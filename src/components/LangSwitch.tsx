"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/dictionaries";
import { useLocale } from "./LocaleProvider";

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export default function LangSwitch() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  };

  return (
    <div
      className="flex items-center gap-1 font-display text-[11px] tracking-[0.16em]"
      role="group"
      aria-label={t.langSwitchAria}
    >
      <button
        type="button"
        disabled={pending}
        onClick={() => switchTo("zh")}
        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
          locale === "zh"
            ? "text-ink font-bold"
            : "text-muted hover:text-ink"
        }`}
      >
        中
      </button>
      <span className="text-black/20">/</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => switchTo("en")}
        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
          locale === "en"
            ? "text-ink font-bold"
            : "text-muted hover:text-ink"
        }`}
      >
        EN
      </button>
    </div>
  );
}
