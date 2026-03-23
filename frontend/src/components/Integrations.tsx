import React from 'react'
import { Zap, File, FileJson } from 'lucide-react'
import Button from './Button'

export default function Integrations() {
  const integrations = [
    {
      icon: Zap,
      name: 'Jira Tickets',
      description: 'Pull requirements directly from Jira issues'
    },
    {
      icon: FileJson,
      name: 'Swagger API',
      description: 'Import OpenAPI specifications automatically'
    },
    {
      icon: File,
      name: 'User Stories',
      description: 'Upload markdown or PDF documentation'
    },
    {
      icon: Zap,
      name: 'PDF Specs',
      description: 'Extract requirements from PDF files'
    }
  ]

  return (
    <section className="py-24 px-6 lg:px-12 bg-slate-950">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-2">Works with your existing docs</h2>
          <p className="text-slate-400">Upload or connect your source of truth.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-20">
          {integrations.map((integration, idx) => {
            const Icon = integration.icon
            return (
              <Button key={idx} variant="outline" className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition flex items-center gap-2 text-white">
                <Icon size={20} className="text-cyan-400" />
                <span className="font-semibold">{integration.name}</span>
              </Button>
            )
          })}
        </div>

        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-16">How it works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
              <div className="text-6xl font-bold text-slate-700 mb-4">01</div>
              <div className="flex justify-center mb-4">
                <Zap className="text-cyan-400" size={40} strokeWidth={1.5} />
              </div>
              <h4 className="text-xl font-bold mb-2">Import Requirements</h4>
              <p className="text-slate-400">Paste text, upload PDFs, or connect your Jira/Swagger documentation directly.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
              <div className="text-6xl font-bold text-slate-700 mb-4">02</div>
              <div className="flex justify-center mb-4">
                <Zap className="text-purple-400" size={40} strokeWidth={1.5} />
              </div>
              <h4 className="text-xl font-bold mb-2">AI Analysis</h4>
              <p className="text-slate-400">Our engine parses logic, identifies edge cases, and maps user flows instantly.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
              <div className="text-6xl font-bold text-slate-700 mb-4">03</div>
              <div className="flex justify-center mb-4">
                <Zap className="text-emerald-400" size={40} strokeWidth={1.5} />
              </div>
              <h4 className="text-xl font-bold mb-2">Export & Sync</h4>
              <p className="text-slate-400">Download as CSV/Excel or sync created test cases back to your management tool.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
