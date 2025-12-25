import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bible Memorization App',
  description: 'Memorize Bible verses with AI-powered coaching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50" suppressHydrationWarning>{children}</body>
    </html>
  );
}

