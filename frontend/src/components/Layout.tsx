import React, { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  User, Settings, Zap,
  Home, FolderOpen, Sparkles, TestTube, Link, File, BarChart, Users, CreditCard,
  Menu, Kanban
} from 'lucide-react'
import Button from './Button'

interface NavigationItem {
  name: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', icon: Home, href: '/dashboard' },
  { name: 'Projects', icon: FolderOpen, href: '/projects' },
  { name: 'Backlogs', icon: Kanban, href: '/backlogs' },
  { name: 'AI Generator', icon: Sparkles, href: '/ai-generator' },
  { name: 'Test Case Manager', icon: TestTube, href: '/test-manager' },
  { name: 'RTM', icon: Link, href: '/rtm' },
  { name: 'Documents', icon: File, href: '/documents' },
  { name: 'Analytics', icon: BarChart, href: '/analytics' },
  { name: 'Team', icon: Users, href: '/team' },
  { name: 'Settings', icon: Settings, href: '/settings' },
  { name: 'Billing', icon: CreditCard, href: '/billing' },
]

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      setUser({ firstName: 'Demo', lastName: 'User', email: 'user@example.com' })
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">TestGen AI</h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const current = router.pathname === item.href
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${current
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </a>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  className="text-slate-400 hover:text-white lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold text-white ml-4">{router.pathname.replace('/', '') || 'Dashboard'}</h2>
              </div>
              {/* right side placeholders or user actions can go here */}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
