import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bnk2026",
  description: "Application Bnk2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
