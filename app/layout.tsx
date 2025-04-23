import React from 'react';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import './globals.css';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

const inter = Inter({ subsets: ['latin'] });

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'PokeBinder';

export const metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: 'Track your Pokémon Card collection with PokeBinder',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.className} antialiased`}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}