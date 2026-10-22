/**
 * Visas direkt när man klickar på en länk, medan sidan hämtas från servern.
 * Next.js förhämtar den här vyn, så navigeringen känns omedelbar.
 */
export default function Loading() {
  return (
    <div aria-busy="true" className="mx-auto max-w-2xl animate-pulse space-y-4 px-4 py-8">
      <div className="h-8 w-2/3 rounded-xl bg-line" />
      <div className="h-4 w-1/2 rounded-lg bg-line" />
      <div className="space-y-3 pt-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
