import React from 'react'
import { Play, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion' 
import Button from './Button'

export default function Hero() {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  }
  const child = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.45 } }
  }
  return (
    <section className="py-24 px-6 lg:px-12 bg-slate-950 relative overflow-hidden">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-block mb-6 px-9 py-3 bg-slate-850 border border-slate-600 rounded-full">
            <span className="text-cyan-400 text-sm font-semibold">● AI-POWERED QA</span>
          </div>
          
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
          >
            <motion.span variants={child} className="inline-block mr-2">Generate</motion.span>
            <motion.span variants={child} className="inline-block mr-2">Comprehensive</motion.span>
            <motion.span variants={child} className="gradient-text inline-block">Test Cases in Seconds</motion.span>
          </motion.h1>
          
          <p className="text-slate-400 max-w-2xl mb-8 text-lg">
            Turn requirements, user stories, and API specs into production-ready test scenarios, edge cases, and regression checklists automatically.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button variant="primary" className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold px-8 py-3 rounded-lg flex items-center justify-center gap-2">
              Start Generating Free <ArrowRight size={20} />
            </Button>
            <Button variant="outline" className="border border-slate-700 hover:bg-slate-900 text-white font-semibold px-8 py-3 rounded-lg flex items-center justify-center gap-2">
              <Play size={20} /> Watch Demo
            </Button>
          </div>
        </div>

        {/* Demo Box - Custom CSS/Tailwind Graphics */}
        <div className="max-w-4xl mx-auto shadow-[8px_8px_24px_0px_rgba(0,0,0,0.24)]">
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
            {/* Browser Chrome */}
            <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="ml-4 text-slate-400 text-xs">📄 input_requirements.pdf</span>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-2 p-8 gap-8">
              {/* Left Side - Input */}
              <div>
                <div className="text-slate-500 text-xs mb-4 font-mono">{'// User Story: Authentication'}</div>
                <div className="text-slate-300 text-sm leading-relaxed font-mono">
                  <div className="mb-2">As a user, I want to be able to</div>
                  <div className="mb-2">log in with my email and</div>
                  <div className="mb-4">password so that I can access my</div>
                  <div className="mb-2">dashboard.</div>
                  <div className="mt-6 text-slate-500">{'// Acceptance Criteria'}</div>
                  <div className="mt-4">
                    <div>1. User enters valid email/password.</div>
                    <div>2. System validates credentials.</div>
                    <div>3. If valid, redirect to dashboard.</div>
                    <div>4. If invalid, show error message.</div>
                  </div>
                </div>
              </div>

              {/* Right Side - Output */}
              <div>
                <div className="text-cyan-400 text-xs font-semibold mb-4">GENERATED OUTPUT</div>
                <div className="text-slate-300 text-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                      <span className="text-cyan-400 text-xs">✓</span>
                    </div>
                    <span className="font-semibold">TC_001: Valid Login</span>
                  </div>
                  <div className="text-slate-400 text-xs ml-7 mb-4">
                    Verify user can login with valid credentials and redirect to dashboard.
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                      <span className="text-yellow-500 text-xs">⚠</span>
                    </div>
                    <span className="font-semibold">TC_002: Invalid Password</span>
                  </div>
                  <div className="text-slate-400 text-xs ml-7 mb-4">
                    Verify error message &quot;Invalid credentials&quot; appears on wrong password.
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                      <span className="text-blue-500 text-xs">📋</span>
                    </div>
                    <span className="font-semibold">TC_003: SQL Injection Attempt</span>
                  </div>
                  <div className="text-slate-400 text-xs ml-7 mb-4">
                    Verify input fields sanitize special characters and prevent injection.
                  </div>

                  <div className="text-cyan-400 text-xs mt-6">+ View 12 more generated cases</div>
                </div>
                
                <div className="text-slate-500 text-xs mt-6 text-right">Processing complete (0.4s)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
