import type {Metadata} from 'next';
import {connection} from 'next/server';
import {Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans} from 'next/font/google';
import { scheduleImdbDatasetSync } from '@/lib/imdbDatasetSync';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Easy Ratings Database (ERDB)',
  description: 'Easy Ratings Database (ERDB) for dynamic poster, backdrop, and logo ratings.',
};

// Same type stack as realbestia.com: Jakarta for UI text, JetBrains Mono for labels/values,
// Instrument Serif italic for the accent word.
const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const displayFont = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export default async function RootLayout({children}: {children: React.ReactNode}) {
  await connection();
  scheduleImdbDatasetSync();

  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${monoFont.variable} ${displayFont.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
