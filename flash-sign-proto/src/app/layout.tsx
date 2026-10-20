import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/app-context';
import { DemoAuthProvider } from '@/context/demo-auth-context';

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Flash Sign — Authentication & Onboarding Prototype',
    template: '%s | Flash Sign',
  },
  description:
    'Flash Sign is a modern B2B SaaS project management and digital-signature platform.',
  keywords: ['authentication', 'onboarding', 'project management', 'e-signature', 'prototype'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full antialiased">
        <DemoAuthProvider>
          <AppProvider>{children}</AppProvider>
        </DemoAuthProvider>
      </body>
    </html>
  );
}
