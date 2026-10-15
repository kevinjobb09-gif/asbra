"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe, X } from "lucide-react";
import { getCountry, languages, type LanguageCode } from "@/config";
import { useI18n } from "@/i18n/client";

/** Sparar valt språk i en cookie (i ett år) så att det gäller på alla sidor. */
export function setLanguageCookie(code: LanguageCode) {
  document.cookie = `lang=${code}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguagePicker() {
  const { lang, t } = useI18n();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const codes = getCountry().explanationLanguages;

  function choose(code: LanguageCode) {
    setLanguageCookie(code);
    dialog.current?.close();
    startTransition(() => router.refresh());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={t("common.chooseLanguage")}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold hover:bg-primary-soft"
      >
        <Globe size={18} aria-hidden className={pending ? "animate-spin" : ""} />
        <span className="hidden sm:inline" lang={languages[lang].htmlLang}>
          {languages[lang].nativeName}
        </span>
        <span className="uppercase sm:hidden">{lang.slice(0, 2)}</span>
      </button>

      <dialog
        ref={dialog}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/50"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="text-lg font-extrabold">{t("common.chooseLanguage")}</h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label={t("common.close")}
            className="rounded-full p-2 hover:bg-primary-soft"
          >
            <X size={20} />
          </button>
        </div>
        <ul className="grid max-h-[70dvh] grid-cols-2 gap-2 overflow-y-auto p-4">
          {codes.map((code) => {
            const l = languages[code];
            const active = code === lang;
            return (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => choose(code)}
                  lang={l.htmlLang}
                  dir={l.dir}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 px-3 py-3 text-start ${
                    active ? "border-primary bg-primary-soft font-bold" : "border-line hover:border-primary"
                  }`}
                >
                  <span>{l.nativeName}</span>
                  {active && <Check size={18} className="shrink-0 text-primary" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </dialog>
    </>
  );
}
