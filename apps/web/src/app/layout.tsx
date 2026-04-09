import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/ui/nav";
import Footer from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Vibr — Build it. Ship it. Find someone to sell it.",
  description:
    "Vibr turns your skills into a product, a prompt, and finds a marketer who will grow it. AI-powered startup idea generator, local coding IDE with BYOK, and marketer matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          as="image"
          href="https://ui-avatars.com/api/?name=Sarah+Chen&background=1E1E1E&color=F2EFE9&size=160&bold=true&format=svg"
        />
        <link
          rel="preload"
          as="image"
          href="https://ui-avatars.com/api/?name=Marcus+Rivera&background=1E1E1E&color=F2EFE9&size=160&bold=true&format=svg"
        />
        <link
          rel="preload"
          as="image"
          href="https://ui-avatars.com/api/?name=Anika+Patel&background=1E1E1E&color=F2EFE9&size=160&bold=true&format=svg"
        />
      </head>
      <body className="bg-background font-body text-foreground antialiased">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
