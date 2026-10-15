"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe, X } from "lucide-react";
import { getCountry, isLanguageCode, languages, type LanguageCode } from "@/config";
import { useI18n } from "@/i18n/client";

/** Sparar valt språk i en cookie (i ett år) så att det gäller på alla sidor. */
export function setLanguageCookie(code: LanguageCode) {
  document.cookie = `lang=${code}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Står man på en språksida (/ar, /fa …) eller startsidan: vart ska man gå när
 * man byter språk? Returnerar null på alla andra sidor (då laddas sidan bara om).
 */
export function languagePageTarget(pathname: string, code: LanguageCode): string | null {
  const path = pathname.replace(/\/$/, "") || "/";
  const onLanguagePage = path === "/" || (/^\/([a-z]{2,3})$/.test(path) && isLanguageCode(path.slice(1)));
  if (!onLanguagePage) return null;
  return code === "sv" ? "/" : `/${code}`;
}

/**
 * Byter språk och laddar om hela sidan, så att texter, skrivriktning (höger/vänster)
 * och typsnitt byts överallt. På en språksida (t.ex. /ar) går vi till det nya
 * språkets startsida – annars skulle /ar sätta tillbaka arabiska.
 */
export function switchLanguage(code: LanguageCode) {
  setLanguageCookie(code);
  const target = languagePageTarget(window.location.pathname, code);
  window.location.assign(target ?? window.location.href);
}

/** Rutnät med alla språk, skrivna på respektive språk. */
export function LanguageGrid({
  active,
  onChoose,
  columns = 2,
}: {
  active?: LanguageCode;
  onChoose: (code: LanguageCode) => void;
  columns?: 2 | 3;
}) {
  const codes = getCountry().explanationLanguages;
  return (
    <ul className={`grid gap-2 ${columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
      {codes.map((code) => {
        const l = languages[code];
        const isActive = code === active;
        return (
          <li key={code}>
            <button
              type="button"
              onClick={() => onChoose(code)}
              lang={l.htmlLang}
              dir={l.dir}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 px-3 py-3 text-start ${
                isActive ? "border-primary bg-primary-soft font-bold" : "border-line bg-surface hover:border-primary"
              }`}
            >
              <span>{l.nativeName}</span>
              {isActive && <Check size={18} className="shrink-0 text-primary" aria-hidden />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Knappen i sidhuvudet som öppnar språkväljaren. */
export function LanguagePicker() {
  const { lang, t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [switching, setSwitching] = useState(false);

  function choose(code: LanguageCode) {
    dialog.current?.close();
    setSwitching(true);
    switchLanguage(code);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={t("common.chooseLanguage")}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold hover:bg-primary-soft"
      >
        <Globe size={18} aria-hidden className={switching ? "animate-spin" : ""} />
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
        <div className="max-h-[70dvh] overflow-y-auto p-4">
          <LanguageGrid active={lang} onChoose={choose} />
        </div>
      </dialog>
    </>
  );
}

/**
 * "Välj språk" på flera språk samtidigt, så att den som inte kan svenska
 * förstår vad rutan handlar om.
 */
const CHOOSE_LANGUAGE_IN: { lang: LanguageCode; text: string }[] = [
  { lang: "en", text: "Choose your language" },
  { lang: "ar", text: "اختر لغتك" },
  { lang: "fa", text: "زبان خود را انتخاب کنید" },
  { lang: "so", text: "Dooro luqaddaada" },
  { lang: "ti", text: "ቋንቋኻ ምረጽ" },
  { lang: "tr", text: "Dilini seç" },
  { lang: "ru", text: "Выберите язык" },
  { lang: "uk", text: "Оберіть мову" },
];

/**
 * SPRÅKRUTA VID FÖRSTA BESÖKET
 * Sajten är på svenska. Har besökaren inte valt språk visas den här rutan direkt,
 * med telefonens språk som förslag överst. Stänger man rutan blir det svenska.
 */
export function LanguageNotice({ show, suggested }: { show: boolean; suggested: LanguageCode }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (show && !window.location.pathname.startsWith("/admin")) dialog.current?.showModal();
  }, [show]);

  if (!show) return null;

  function keepSwedish() {
    setLanguageCookie("sv");
    dialog.current?.close();
  }

  const suggestion = suggested !== "sv" ? languages[suggested] : null;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="language-notice-title"
      onCancel={keepSwedish}
      className="mx-auto mt-auto mb-0 w-full max-w-lg rounded-t-3xl bg-bg p-0 text-ink shadow-2xl backdrop:bg-ink/60 sm:my-auto sm:rounded-3xl"
    >
      <div className="max-h-[90dvh] overflow-y-auto p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
            <Globe size={26} aria-hidden />
          </span>
          <div className="flex-1">
            <h2 id="language-notice-title" className="text-2xl font-extrabold">
              Välj språk
            </h2>
            <p className="text-sm text-muted">Frågorna är på svenska, som på provet. Förklaringarna kan du läsa på ditt språk.</p>
          </div>
          <button type="button" onClick={keepSwedish} aria-label="Stäng" className="rounded-full p-2 hover:bg-primary-soft">
            <X size={20} />
          </button>
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-primary">
          {CHOOSE_LANGUAGE_IN.map(({ lang, text }) => (
            <li key={lang} lang={languages[lang].htmlLang} dir={languages[lang].dir}>
              {text}
            </li>
          ))}
        </ul>

        {suggestion && (
          <button
            type="button"
            onClick={() => switchLanguage(suggested)}
            lang={suggestion.htmlLang}
            dir={suggestion.dir}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-cta px-6 py-4 text-lg font-bold text-white shadow-md hover:bg-cta-dark"
          >
            <Globe size={20} aria-hidden /> {suggestion.nativeName}
          </button>
        )}

        <div className="mt-4">
          <LanguageGrid onChoose={switchLanguage} columns={3} />
        </div>

        <button
          type="button"
          onClick={keepSwedish}
          className="mt-4 w-full rounded-full border-2 border-line bg-surface px-6 py-3 font-bold"
        >
          Fortsätt på svenska
        </button>
      </div>
    </dialog>
  );
}
