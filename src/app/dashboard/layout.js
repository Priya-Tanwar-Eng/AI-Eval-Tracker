'use client'
import { useAuth } from "../../../lib/AuthContext"
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { LogOut, Settings, BarChart3 } from 'lucide-react'

export default function DashboardLayout({ children }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-800">AI Eval Tracker</h1>
              <div className="flex space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <BarChart3 size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}