import { ButtonLink } from "./ButtonLink";

/** Tillfällig sida för delar som byggs i senare delmål. */
export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-3 text-muted">{text}</p>
      <ButtonLink href="/" variant="outline" className="mt-8">
        Till startsidan
      </ButtonLink>
    </div>
  );
}
