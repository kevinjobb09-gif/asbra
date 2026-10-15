/** Adminsidan är alltid på svenska och skrivs från vänster till höger, oavsett valt språk. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="sv" dir="ltr">
      {children}
    </div>
  );
}
