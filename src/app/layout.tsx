import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kasafide',
  description: 'Verified homes in Sta. Maria, Bulacan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/assets/css/kasafide-theme.css" />
        <Script src="/assets/js/kasafide-theme.js" strategy="beforeInteractive" />
        <Script src="/assets/js/kasafide-logo.js" strategy="beforeInteractive" />
      </head>
      <body className={plusJakartaSans.className}>{children}</body>
    </html>
  );
}
