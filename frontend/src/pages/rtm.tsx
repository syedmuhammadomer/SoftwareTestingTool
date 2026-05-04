'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Link, CheckCircle, Circle } from 'lucide-react'
import Layout from '@/components/Layout'
import { useProjectContext } from '@/context/ProjectContext'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function RtmPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectedProject, loading: projectsLoading } = useProjectContext()

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
            <p className="app-subtext max-w-2xl">
              Monitor how each requirement maps to user stories and test coverage. This view highlights coverage gaps before they hit QA.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs uppercase tracking-widest text-slate-300">
              <Link className="w-4 h-4 text-slate-200" /> {entries.length} Entries
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs uppercase tracking-widest text-slate-300">
              <ClipboardList className="w-4 h-4 text-slate-400" /> {summary.uniqueProjects} Projects
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs uppercase tracking-widest text-slate-300">
              <CheckCircle className="w-4 h-4 text-slate-300" /> {summary.completed} Completed
            </span>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-lg shadow-slate-900/40">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Coverage</p>
            {projectsLoading ? (
              <Skeleton className="mt-2 h-8 w-16 rounded-md" />
            ) : (
              <p className="text-2xl font-semibold text-white">{summary.totalEntries}</p>
            )}
            <p className="app-subtext">Requirements being tracked</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-900/40">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Ready For QA</p>
            {projectsLoading ? (
              <Skeleton className="mt-2 h-8 w-16 rounded-md" />
            ) : (
              <p className="text-2xl font-semibold text-white">{summary.completed}</p>
            )}
            <p className="app-subtext">Projects completed in queue</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-900/40">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Automation Focus</p>
            {projectsLoading ? (
              <Skeleton className="mt-2 h-8 w-16 rounded-md" />
            ) : (
              <p className="text-2xl font-semibold text-white">{Math.max(0, entries.length - summary.completed)}</p>
            )}
            <p className="app-subtext">Requirements needing test coverage</p>
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
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
              <Skeleton className="h-6 w-40 rounded-md" />
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 text-sm text-slate-200">
              {error}
            </div>
          )}

          {!loading && !error && projectsLoading && <TableSkeleton rows={6} />}

          {!loading && !error && !projectsLoading && !selectedProject && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
              Select a project from the dropdown next to the logo to view its RTM.
            </div>
          )}

          {!loading && !error && !projectsLoading && selectedProject && entries.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
              No RTM entries yet. Queue a project to generate a matrix automatically.
            </div>
          )}

          {!loading && !error && !projectsLoading && entries.length > 0 && (
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
                        <span className="flex items-center gap-1 rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-slate-300">
                          <CheckCircle className="w-3 h-3" /> Live
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-slate-300">
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
