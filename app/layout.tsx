import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ardysurya.id"),
  title: "Ardy Surya & Mila Arinda — Wedding Invitation",
  description:
    "Join us in celebrating the wedding of Ardy Surya & Mila Arinda on July 18, 2026 in Jepara, Indonesia.",
  openGraph: {
    title: "Ardy Surya & Mila Arinda — Wedding Invitation",
    description:
      "Join us in celebrating the wedding of Ardy Surya & Mila Arinda on July 18, 2026 in Jepara, Indonesia.",
    type: "website",
    locale: "id_ID",
    siteName: "Ardy Surya & Mila Arinda",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ardy Surya & Mila Arinda — Wedding Invitation",
    description:
      "Join us in celebrating the wedding of Ardy Surya & Mila Arinda on July 18, 2026 in Jepara, Indonesia.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${montserrat.variable} scroll-smooth`}
    >
      <body className="bg-[#080808] antialiased">{children}</body>
    </html>
  );
}
