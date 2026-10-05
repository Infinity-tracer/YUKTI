import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'YUKTI | Industrial Optimization Intelligence',
  description: 'Indigenous mathematical optimization platform for mission-critical industrial systems. Built from first principles for refineries, power grids, and supply chains.',
  keywords: ['optimization', 'linear programming', 'MILP', 'refinery', 'industrial', 'solver'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-display bg-yukti-bg text-yukti-text antialiased min-h-screen">
        <div className="noise">
          {children}
        </div>
      </body>
    </html>
  )
}
