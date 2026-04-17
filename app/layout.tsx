import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/lib/toast/ToastContext';

export const metadata: Metadata = {
  title: 'Jigyasu Sales App',
  description: 'Mobile-first CRM for managing school leads sourced from events',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Poppins:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface-900 text-surface-50 min-h-screen antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
