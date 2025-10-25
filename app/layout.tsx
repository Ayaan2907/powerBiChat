import type { Metadata } from 'next'

import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

import { Geist, Geist_Mono, Geist as V0_Font_Geist, Geist_Mono as V0_Font_Geist_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'

// Initialize fonts
const _geist = V0_Font_Geist({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'AdvancelQ.ai - Power BI Analytics Dashboard',
  description: 'AI-powered Power BI analytics platform by AdvancelQ.ai, a Pinetail Capital LLC company',
  generator: 'AdvancelQ.ai',
  keywords: ['Power BI', 'Analytics', 'AI', 'Business Intelligence', 'AdvancelQ.ai'],
  authors: [{ name: 'AdvancelQ.ai' }],
  icons: {
    icon: '/advancelq-icon.svg',
    shortcut: '/advancelq-icon.svg',
    apple: '/advancelq-icon.svg',
  },
  openGraph: {
    title: 'AdvancelQ.ai - Power BI Analytics Dashboard',
    description: 'AI-powered Power BI analytics platform',
    type: 'website',
    images: ['/advancelq-icon.svg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`font-sans antialiased`}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
