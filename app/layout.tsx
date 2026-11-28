import type { Metadata } from "next";
import { site, socials } from "@/lib/content";
import "./globals.css";

const title = site.name;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description: site.description,
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.png", apple: "/img/apple-touch-icon.png" },
  openGraph: { type: "website", url: "/", title, description: site.description },
  twitter: { card: "summary_large_image", creator: "@IsaiahSrc" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  image: `${site.url}/img/avatar-mii.webp`,
  jobTitle: site.role,
  email: site.email,
  sameAs: socials.map((s) => s.href),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
