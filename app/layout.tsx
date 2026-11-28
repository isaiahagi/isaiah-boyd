import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Providers } from "@/components/providers";
import { site, socials } from "@/lib/content";
import "./globals.css";

const title = `${site.name} · ${site.role}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description: site.description,
  authors: [{ name: site.name }],
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.png", apple: "/img/apple-touch-icon.png" },
  openGraph: { type: "website", url: "/", siteName: site.name, title, description: site.description },
  twitter: { card: "summary_large_image", site: "@IsaiahSrc", creator: "@IsaiahSrc" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

// Applies a saved theme before first paint. The key is shared with /learnai.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  image: `${site.url}/img/avatar-mii.webp`,
  jobTitle: site.role,
  email: site.email,
  address: { "@type": "PostalAddress", addressLocality: "Palm Coast", addressRegion: "FL", addressCountry: "US" },
  sameAs: socials.map((s) => s.href),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
