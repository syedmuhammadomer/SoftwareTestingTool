'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { Filter, Settings, ClipboardList } from 'lucide-react'
import { useProjectContext } from '@/context/ProjectContext'
import { User } from '@/types'
import { hasPermission } from '@/utils/access'
import PageLoading from '@/components/PageLoading'

type ModalMode = 'view' | 'edit' | 'create'

type TestCase = {
  id: string
  title: string
  requirement: string
  scenario: string
  priority: 'High' | 'Medium' | 'Low' | 'Critical'
  status: 'Passed' | 'Failed' | 'In Progress' | 'Not Started'
  updated: string
  preconditions?: string
  steps?: string
  expectedResult?: string
}

const statusColors: Record<string, string> = {
  Passed: 'bg-slate-500/10 text-slate-300',
  Failed: 'bg-slate-500/10 text-slate-300',
  'In Progress': 'bg-white/10 text-slate-300',
  'Not Started': 'bg-slate-800 text-slate-300',
}

const priorityColors: Record<string, string> = {
  Critical: 'bg-slate-500/10 text-slate-300',
  High: 'bg-slate-400/10 text-slate-300',
  Medium: 'bg-slate-500/10 text-slate-300',
  Low: 'bg-slate-800 text-slate-300',
}

const badgeBase = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]'

const renderBadge = (value: string, map?: Record<string, string>) => (
  <span className={`${badgeBase} ${map?.[value] ?? 'bg-slate-700 text-slate-200'}`}>{value}</span>
)

export default function TestManagerPage() {
  const router = useRouter()
  const { selectedProject, loading: projectsLoading } = useProjectContext()
  const [filter, setFilter] = useState<string>('All Status')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    const storedUser = localStorage.getItem('userData')
    setUser(storedUser ? (JSON.parse(storedUser) as User) : null)
    setLoading(false)
  }, [router])

  const canCreateTestCases = hasPermission(user, 'test_cases:create')

  const testCases = useMemo<TestCase[]>(() => {
    if (!selectedProject) return []

    return (selectedProject.testCases ?? []).map((testCase, index) => {
      const linkedRequirement =
        selectedProject.rtm?.find((entry) => entry.linkedTestCases?.includes(testCase.testCaseId))?.requirementId ??
        'Unmapped'

      return {
        id: testCase.testCaseId,
        title: testCase.title,
        requirement: linkedRequirement,
        scenario: selectedProject.features?.[index]?.title || selectedProject.name,
        priority: index % 4 === 0 ? 'Critical' : index % 4 === 1 ? 'High' : index % 4 === 2 ? 'Medium' : 'Low',
        status:
          selectedProject.status === 'completed'
            ? 'Passed'
            : selectedProject.status === 'failed'
              ? 'Failed'
              : 'In Progress',
        updated: selectedProject.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        preconditions: testCase.preconditions,
        steps: testCase.steps,
        expectedResult: testCase.expectedResult,
      }
    })
  }, [selectedProject])

  const stats = useMemo(() => {
    const total = testCases.length
    const passed = testCases.filter((tc) => tc.status === 'Passed').length
    const failed = testCases.filter((tc) => tc.status === 'Failed').length
    const inProgress = testCases.filter((tc) => tc.status === 'In Progress').length
    return { total, passed, failed, inProgress }
  }, [testCases])

  const filtered = useMemo(() => {
    const statusFiltered = filter === 'All Status' ? testCases : testCases.filter((tc) => tc.status === filter)
    return statusFiltered.filter((tc) =>
      `${tc.id} ${tc.title} ${tc.requirement} ${tc.scenario}`.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [filter, searchTerm, testCases])

  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [modalTestCase, setModalTestCase] = useState<TestCase | null>(null)
  const [editForm, setEditForm] = useState<TestCase | null>(null)
  const defaultCreateForm = (): TestCase => ({
    id: 'TC-999',
    title: '',
    requirement: '',
    scenario: '',
    priority: 'Medium',
    status: 'Not Started',
    updated: new Date().toISOString().split('T')[0],
    preconditions: '',
    steps: '',
    expectedResult: '',
  })

  const [createForm, setCreateForm] = useState<TestCase>(defaultCreateForm())

  useEffect(() => {
    if (modalMode === 'edit' && modalTestCase) {
      setEditForm({ ...modalTestCase })
    }
  }, [modalMode, modalTestCase])

  const closeModal = () => {
    setModalMode(null)
    setModalTestCase(null)
  }

  const handleEditChange = (field: keyof TestCase, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleCreateChange = (field: keyof TestCase, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleOpenCreate = () => {
    setCreateForm(defaultCreateForm())
    setModalMode('create')
    setModalTestCase(null)
  }

  if (loading || projectsLoading) {
    return <PageLoading kind="board" />
  }

  const renderModalBody = () => {
    if (!modalMode) return null

    const renderHeader = (label: string, value: string, badgeMap?: Record<string, string>) => (
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{label}</p>
        {badgeMap ? (
          renderBadge(value, badgeMap)
        ) : (
          <p className="text-lg font-semibold text-white">{value}</p>
        )}
      </div>
    )

    if (modalMode === 'view' && modalTestCase) {
      const steps = modalTestCase.steps?.split('\n').filter(Boolean) ?? []
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-6">
            {renderHeader('ID', modalTestCase.id)}
            {renderHeader('Requirement', modalTestCase.requirement)}
            {renderHeader('Scenario', modalTestCase.scenario)}
            {renderHeader('Priority', modalTestCase.priority, priorityColors)}
            {renderHeader('Status', modalTestCase.status, statusColors)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Preconditions</p>
              <p className="mt-2 text-sm text-slate-200">{modalTestCase.preconditions ?? 'Not specified'}</p>
            </article>
            <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Expected Result</p>
              <p className="mt-2 text-sm text-slate-200">{modalTestCase.expectedResult ?? 'Not specified'}</p>
            </article>
          </div>
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Steps</p>
              <span className="text-xs text-slate-500">Updated {modalTestCase.updated}</span>
            </div>
            <ol className="space-y-2 pl-4 text-sm leading-relaxed text-slate-200">
              {steps.length > 0 ? (
                steps.map((step) => <li key={step}>{step}</li>)
              ) : (
                <li>No steps provided.</li>
              )}
            </ol>
          </section>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={closeModal}>Close</Button>
            <Button variant="secondary" size="sm" onClick={() => setModalMode('edit')}>Edit</Button>
          </div>
        </div>
      )
    }

    if (modalMode === 'edit' && editForm) {
      return (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="block space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Title</span>
              <input
                value={editForm.title}
                onChange={(e) => handleEditChange('title', e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
              />
            </label>
            <label className="block space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Scenario</span>
              <input
                value={editForm.scenario}
                onChange={(e) => handleEditChange('scenario', e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
              />
            </label>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="block space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Priority</span>
              <select
                value={editForm.priority}
                onChange={(e) => handleEditChange('priority', e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label className="block space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Status</span>
              <select
                value={editForm.status}
                onChange={(e) => handleEditChange('status', e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
              >
                <option>Passed</option>
                <option>Failed</option>
                <option>In Progress</option>
                <option>Not Started</option>
              </select>
            </label>
          </div>
          <div className="flex gap-3">
            {renderBadge(editForm.priority, priorityColors)}
            {renderBadge(editForm.status, statusColors)}
          </div>
          <label className="block space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Preconditions</span>
            <textarea
              value={editForm.preconditions}
              onChange={(e) => handleEditChange('preconditions', e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
            />
          </label>
          <label className="block space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Expected Result</span>
            <textarea
              value={editForm.expectedResult}
              onChange={(e) => handleEditChange('expectedResult', e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
            />
          </label>
          <label className="block space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Steps</span>
            <textarea
              value={editForm.steps}
              onChange={(e) => handleEditChange('steps', e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
            />
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
            <Button variant="secondary" size="sm">Save</Button>
          </div>
        </div>
      )
    }

    if (modalMode === 'create') {
      return (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="block space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Title</span>
              <input
                value={createForm.title}
                onChange={(e) => handleCreateChange('title', e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
              />
            </label>
            <label className="block space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Requirement</span>
              <input
                value={createForm.requirement}
                onChange={(e) => handleCreateChange('requirement', e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
              />
            </label>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="block space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Scenario</span>
              <input
                value={createForm.scenario}
                onChange={(e) => handleCreateChange('scenario', e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
              />
            </label>
            <label className="block space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Priority</span>
              <select
                value={createForm.priority}
                onChange={(e) => handleCreateChange('priority', e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
          </div>
          <label className="block space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Status</span>
            <select
              value={createForm.status}
              onChange={(e) => handleCreateChange('status', e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
            >
              <option>Passed</option>
              <option>Failed</option>
              <option>In Progress</option>
              <option>Not Started</option>
            </select>
          </label>
          <div className="flex gap-3">
            {renderBadge(createForm.priority, priorityColors)}
            {renderBadge(createForm.status, statusColors)}
          </div>
          <label className="block space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Preconditions</span>
            <textarea
              value={createForm.preconditions}
              onChange={(e) => handleCreateChange('preconditions', e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
            />
          </label>
          <label className="block space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Expected Result</span>
            <textarea
              value={createForm.expectedResult}
              onChange={(e) => handleCreateChange('expectedResult', e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
            />
          </label>
          <label className="block space-y-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Steps</span>
            <textarea
              value={createForm.steps}
              onChange={(e) => handleCreateChange('steps', e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:ring-2 focus:ring-white/30"
            />
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
            <Button variant="secondary" size="sm">Create</Button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Quality Ops</p>
            <h1 className="text-3xl font-semibold text-white">Test Case Manager</h1>
            <p className="app-subtext max-w-2xl">
              Organize, filter, and batch manage all generated test cases with clarity and productivity insights.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="md">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            {canCreateTestCases ? (
              <Button size="md" onClick={handleOpenCreate}>
                <ClipboardList className="mr-2 h-4 w-4" />
                New Test Case
              </Button>
            ) : null}
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Passed', value: stats.passed },
            { label: 'Failed', value: stats.failed },
            { label: 'In Progress', value: stats.inProgress },
          ].map((kpi) => (
            <article key={kpi.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{kpi.label}</p>
              <p className="text-3xl font-semibold text-white">{kpi.value}</p>
            </article>
          ))}
        </section>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Search & filter</p>
              <input
                placeholder="Search test cases, requirements…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="rounded-full border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-200"
              >
                <option>All Status</option>
                <option>Passed</option>
                <option>Failed</option>
                <option>In Progress</option>
                <option>Not Started</option>
              </select>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Bulk Actions
              </Button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            {!selectedProject && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 app-subtext">
                Select a project from the dropdown next to the logo to view its test cases.
              </div>
            )}
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="text-xs uppercase tracking-[0.4em] text-slate-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Requirement</th>
                  <th className="px-4 py-3">Scenario</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {selectedProject && filtered.length === 0 && (
                  <tr className="border-t border-slate-800">
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      No test cases found for this project.
                    </td>
                  </tr>
                )}
                {filtered.map((testCase) => (
                  <tr
                    key={testCase.id}
                    className="border-t border-slate-800 hover:bg-slate-950/40 cursor-pointer"
                    onClick={() => {
                      setModalTestCase(testCase)
                      setModalMode('view')
                    }}
                  >
                    <td className="px-4 py-3 font-semibold text-white">{testCase.id}</td>
                    <td className="px-4 py-3">{testCase.title}</td>
                    <td className="px-4 py-3">{testCase.requirement}</td>
                    <td className="px-4 py-3">{testCase.scenario}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-300">
                        {testCase.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[testCase.status] || statusColors.Passed}`}>
                        {testCase.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{testCase.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {modalMode && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
            <div className="flex min-h-full items-start justify-center py-6">
            <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950/90 p-6 shadow-2xl min-h-[520px]">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Test Case</p>
                <button
                  className="text-slate-400 transition hover:text-white"
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <div>
                {renderModalBody()}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
