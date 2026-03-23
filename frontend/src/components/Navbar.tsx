import React from 'react'
import { Zap } from 'lucide-react'
import Link from 'next/link'
import Button from './Button'

export default function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950">
      <div className="container mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <div className="text-cyan-400">
            <Zap size={24} strokeWidth={1.5} />
          </div>
          <span className="text-white">TestGen AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-slate-100 hover:text-white text-lg">Integrations</a>
          <a href="#" className="text-slate-100 hover:text-white text-lg">Features</a>
          <a href="#" className="text-slate-100 hover:text-white text-lg">How it Works</a>
          <Link href="/pricing" className="text-slate-100 hover:text-white text-lg">Pricing</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline" size="sm" className="text-slate-300 hover:text-white">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold px-6 py-2 rounded-full">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
