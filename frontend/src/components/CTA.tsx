import React from 'react'
import Button from './Button'

export default function CTA() {
  return (
    <section className="py-24 px-6 lg:px-12 bg-slate-950">
      <div className="container mx-auto">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-16 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to automate your QA workflow?</h2>
          <p className="text-slate-300 mb-8 text-lg">
            Join 10,000+ developers and QA engineers who are saving hours every week.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold px-8 py-3 rounded-lg">
              Get Started for Free
            </Button>
            <Button variant="outline" className="border border-slate-600 hover:bg-slate-800 text-white font-semibold px-8 py-3 rounded-lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
