import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../../lib/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Eval Tracker',
  description: 'AI Agent Evaluation Framework',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}