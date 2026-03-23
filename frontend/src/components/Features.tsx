import React from 'react'
import { FileText, Shield, GitBranch, RotateCw } from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: FileText,
      title: 'Test Case Generation',
      description: 'Automatically convert requirements into detailed step-by-step test cases with expected results.'
    },
    {
      icon: Shield,
      title: 'Edge Case Discovery',
      description: 'AI identifies boundary values and negative scenarios you might miss.'
    },
    {
      icon: GitBranch,
      title: 'Test Scenarios',
      description: 'High-level end-to-end user flows mapped directly from user stories.'
    },
    {
      icon: RotateCw,
      title: 'Regression Checklists',
      description: 'Smart impact analysis creates focused regression suites for code changes.'
    }
  ]

  return (
    <section className="py-24 px-6 lg:px-12 bg-slate-950">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need for <span className="gradient-text">Quality Assurance</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Stop writing manual test cases. Let our AI analyze your documentation and generate comprehensive coverage in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-8 hover:border-slate-700 transition">
                <div className="text-cyan-400 mb-4">
                  <Icon size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
