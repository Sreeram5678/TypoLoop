import type { Metadata } from 'next';
import { Newsreader, JetBrains_Mono, Geist } from 'next/font/google';
import './globals.css';
import { SettingsProvider } from '@/context/SettingsContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SettingsModal } from '@/components/SettingsModal';

const newsreader = Newsreader({
  variable: '--font-serif',
  subsets: ['latin'],
  style: ['normal', 'italic'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TypoLoop — Coffeehouse Touch Typing with Google Gemma 4 AI',
  description:
    'Distraction-free, light-roast touch typing suite with neuromuscular biomechanics, latency heatmaps, and adaptive coaching powered by Google Gemma 4 on Apple Silicon.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${newsreader.variable} ${jetbrainsMono.variable} ${geistSans.variable} h-full antialiased`}
      style={{ backgroundColor: '#fbf8f3', color: '#2a1e17', colorScheme: 'light' }}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#fbf8f3] text-[#2a1e17] selection:bg-[#b4692c]/20 selection:text-[#2a1e17]"
        style={{ backgroundColor: '#fbf8f3', color: '#2a1e17' }}
      >
        <SettingsProvider>
          <Navbar />
          <div className="flex-1 flex flex-col bg-[#fbf8f3]">{children}</div>
          <Footer />
          <SettingsModal />
        </SettingsProvider>
      </body>
    </html>
  );
}
