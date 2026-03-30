'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Link, CheckCircle, Circle } from 'lucide-react'
import Layout from '@/components/Layout'
import { useProjectContext } from '@/context/ProjectContext'

export default function RtmPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectedProject } = useProjectContext()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setError('Please log in to view the RTM.')
      setLoading(false)
      return
    }
    setLoading(false)
  }, [])

  const entries = useMemo(() => {
    if (!selectedProject) return []
    return (selectedProject.rtm ?? []).map((entry) => ({
      ...entry,
      projectName: selectedProject.name,
      projectStatus: selectedProject.status,
      lastUpdated: selectedProject.updatedAt,
    }))
  }, [selectedProject])

  const summary = useMemo(() => {
    const totalEntries = entries.length
    const uniqueProjects = selectedProject ? 1 : 0
    const completed = selectedProject?.status === 'completed' ? 1 : 0
    return { totalEntries, uniqueProjects, completed }
  }, [entries, selectedProject])

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Traceability</p>
            <h1 className="text-3xl font-semibold text-white">Requirement Traceability Matrix</h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Monitor how each requirement maps to user stories and test coverage. This view highlights coverage gaps before they hit QA.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs uppercase tracking-widest text-slate-300">
              <Link className="w-4 h-4 text-cyan-400" /> {entries.length} Entries
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs uppercase tracking-widest text-slate-300">
              <ClipboardList className="w-4 h-4 text-emerald-400" /> {summary.uniqueProjects} Projects
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs uppercase tracking-widest text-slate-300">
              <CheckCircle className="w-4 h-4 text-lime-400" /> {summary.completed} Completed
            </span>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-lg shadow-slate-900/40">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Coverage</p>
            <p className="text-2xl font-semibold text-white">{summary.totalEntries}</p>
            <p className="text-sm text-slate-400">Requirements being tracked</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-900/40">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Ready For QA</p>
            <p className="text-2xl font-semibold text-white">{summary.completed}</p>
            <p className="text-sm text-slate-400">Projects completed in queue</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-900/40">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Automation Focus</p>
            <p className="text-2xl font-semibold text-white">{Math.max(0, entries.length - summary.completed)}</p>
            <p className="text-sm text-slate-400">Requirements needing test coverage</p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Live RTM Grid</h2>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
              {selectedProject ? 1 : 0} projects · {entries.length} entries
            </p>
          </div>

          {loading && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
              Loading RTM data…
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-800 bg-rose-900/20 p-6 text-sm text-rose-200">
              {error}
            </div>
          )}

          {!loading && !error && !selectedProject && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
              Select a project from the dropdown next to the logo to view its RTM.
            </div>
          )}

          {!loading && !error && selectedProject && entries.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
              No RTM entries yet. Queue a project to generate a matrix automatically.
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-slate-950">
              <div className="grid grid-cols-12 gap-0 border-b border-slate-800 bg-slate-950/80 px-6 py-3 text-xs uppercase tracking-[0.4em] text-slate-500">
                <span className="col-span-3">Requirement</span>
                <span className="col-span-4">Description</span>
                <span className="col-span-2 text-left">
                  Stories
                </span>
                <span className="col-span-2 text-left">
                  Tests
                </span>
                <span className="col-span-1 text-right">Status</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {entries.map((entry) => (
                  <div
                    key={`${entry.projectName}-${entry.requirementId}`}
                    className="grid grid-cols-12 gap-0 border-b border-slate-900 px-6 py-5 text-sm text-slate-200 hover:bg-slate-900"
                  >
                    <div className="col-span-3">
                      <p className="font-semibold text-white">{entry.requirementId}</p>
                      <p className="text-xs text-slate-500">{entry.projectName}</p>
                    </div>
                    <div className="col-span-4">
                      <p className="text-sm text-slate-300 line-clamp-2">{entry.description}</p>
                      {entry.lastUpdated && (
                        <p className="mt-1 text-xs text-slate-500">
                          Updated {new Date(entry.lastUpdated).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 text-left">
                      <p className="font-semibold text-white">{entry.linkedUserStories?.length ?? 0}</p>
                      <p className="text-xs text-slate-500">Stories</p>
                    </div>
                    <div className="col-span-2 text-left">
                      <p className="font-semibold text-white">{entry.linkedTestCases?.length ?? 0}</p>
                      <p className="text-xs text-slate-500">Tests</p>
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-[0.3em]">
                      {entry.projectStatus === 'completed' ? (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                          <CheckCircle className="w-3 h-3" /> Live
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-300">
                          <Circle className="w-2 h-2" /> {entry.projectStatus}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}
