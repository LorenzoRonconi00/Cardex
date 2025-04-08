import React from 'react';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import './globals.css';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Cardex - Pokémon Alt Art Card Collector',
  description: 'Track your Pokémon Trading Card Game Alt Art collection with Cardex',
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