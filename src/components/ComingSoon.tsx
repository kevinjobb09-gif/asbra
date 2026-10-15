import { ButtonLink } from "./ButtonLink";

/** Enkel sida med rubrik, text och en knapp till startsidan. */
export function ComingSoon({ title, text, buttonLabel }: { title: string; text: string; buttonLabel: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-3 text-muted">{text}</p>
      <ButtonLink href="/" variant="outline" className="mt-8">
        {buttonLabel}
      </ButtonLink>
    </div>
  );
}
