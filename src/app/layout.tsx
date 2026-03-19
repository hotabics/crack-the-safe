import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crack the Safe | 1,000,000 $BLUFF",
  description:
    "Crack the 4-digit code and win 1,000,000 $BLUFF coins. Complete tasks, earn guesses, break the vault.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-vault-black antialiased">
        {children}
      </body>
    </html>
  );
}
