'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { AnimatePresence, motion } from 'framer-motion'
import { Shield, Activity, Mail, Sparkles, UserPlus2, X, CheckCircle2, ChevronDown, Users, Briefcase, Trash2 } from 'lucide-react'
import { handleApiError } from '@/utils/config'
import { InviteTeamMemberPayload, teamService, TeamActivityRecord, TeamMemberRecord } from '@/services/teamService'
import { useProjectContext } from '@/context/ProjectContext'
import PageLoading from '@/components/PageLoading'

const inviteRoles = ['QA', 'Product Owner', 'Developer']
const inviteTeams = ['Quality Ops', 'Automation Guild', 'Product QA', 'Platform Reliability']
const accessPresets = [
  { id: 'full', name: 'Full workspace', description: 'Can access all projects, dashboards, and reports.' },
  { id: 'project', name: 'Assigned projects only', description: 'Scoped to selected workspaces and delivery boards.' },
  { id: 'review', name: 'Review only', description: 'Can comment, validate, and approve coverage without editing.' },
]
const roleAccessMap: Record<string, string[]> = {
  QA: [
    'Dashboard analytics',
    'Assigned projects',
    'Create user stories',
    'Create test cases',
    'Requirement documents',
    'Manage backlogs and testing status',
    'Bug reports and story-test links',
  ],
  'Product Owner': [
    'Dashboard analytics',
    'Create project',
    'Assigned projects',
    'Create user stories and test cases',
    'Requirement documents, backlogs, and RTM',
    'Team management and sprint planning',
    'Story assignment and backlog approval',
  ],
  Developer: [
    'Dashboard analytics',
    'Assigned projects',
    'Requirement documents and backlogs',
    'Update ticket status',
    'Move tasks across workflow stages',
    'Development comments and progress tracking',
  ],
}

export default function TeamPage() {
  const router = useRouter()
  const { projects } = useProjectContext()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMemberRecord[]>([])
  const [activity, setActivity] = useState<TeamActivityRecord[]>([])
  const [roles, setRoles] = useState<Array<{ name: string; desc: string }>>([])
  const [stats, setStats] = useState({ totalMembers: 0, activeNow: 0, avgTestCases: 0 })
  const [pageError, setPageError] = useState<string | null>(null)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)
  const [isDeletingMemberId, setIsDeletingMemberId] = useState<number | null>(null)
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    role: 'QA',
    team: 'Quality Ops',
    project: '',
    accessPreset: 'project',
    sendCopy: true,
    addWelcomeNote: true,
  })

  const inviteProjects = useMemo(
    () => (projects.length > 0 ? projects.map((project) => project.name) : ['Banking App', 'Healthcare Portal', 'Inventory Portal', 'Payments Hub']),
    [projects],
  )

  const selectedAccess = useMemo(
    () => accessPresets.find((preset) => preset.id === inviteForm.accessPreset) ?? accessPresets[1],
    [inviteForm.accessPreset],
  )
  const selectedRoleAccess = roleAccessMap[inviteForm.role] ?? []

  useEffect(() => {
    if (!inviteForm.project && inviteProjects.length > 0) {
      setInviteForm((current) => ({ ...current, project: inviteProjects[0] }))
    }
  }, [inviteForm.project, inviteProjects])

  const loadTeamDashboard = async () => {
    try {
      setPageError(null)
      const data = await teamService.getDashboard()
      setMembers(data.members)
      setActivity(data.activity)
      setRoles(data.roles)
      setStats(data.stats)
    } catch (error) {
      setPageError(handleApiError(error))
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }

    void loadTeamDashboard().finally(() => setLoading(false))
  }, [router])

  const updateInviteForm = <K extends keyof typeof inviteForm>(key: K, value: (typeof inviteForm)[K]) => {
    setInviteForm((current) => ({ ...current, [key]: value }))
  }

  const handleInviteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmittingInvite(true)
    try {
      const payload: InviteTeamMemberPayload = {
        fullName: inviteForm.fullName.trim(),
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        team: inviteForm.team,
        project: inviteForm.project,
        accessPreset: inviteForm.accessPreset as InviteTeamMemberPayload['accessPreset'],
        sendCopy: inviteForm.sendCopy,
        addWelcomeNote: inviteForm.addWelcomeNote,
      }
      await teamService.inviteMember(payload)
      await loadTeamDashboard()
      setInviteSent(true)
    } catch (error) {
      setPageError(handleApiError(error))
    } finally {
      setIsSubmittingInvite(false)
    }
  }

  const handleDeleteMember = async (memberId: number) => {
    setIsDeletingMemberId(memberId)
    try {
      await teamService.deleteMember(memberId)
      await loadTeamDashboard()
    } catch (error) {
      setPageError(handleApiError(error))
    } finally {
      setIsDeletingMemberId(null)
    }
  }

  if (loading) {
    return <PageLoading kind="team" />
  }

  return (
    <Layout>
      <div className="p-6 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Team Operations</p>
            <h1 className="text-3xl font-semibold text-white">Team Management</h1>
            <p className="app-subtext max-w-2xl">
              Keep a pulse on your QA unit—who is online, what they are working on, and the role-level permissions that define coverage.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="md">Export CSV</Button>
            <Button size="md" onClick={() => {
              setInviteSent(false)
              setPageError(null)
              setIsInviteOpen(true)
            }}>
              Invite Member
            </Button>
          </div>
        </header>

        {pageError ? (
          <div className="rounded-2xl border border-slate-500/20 bg-slate-500/10 p-4 text-sm text-slate-200">
            {pageError}
          </div>
        ) : null}

        <section className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Total Members</p>
            <p className="text-3xl font-semibold text-white">{stats.totalMembers}</p>
            <p className="app-subtext">Currently in the workspace</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Active Now</p>
            <p className="text-3xl font-semibold text-slate-300">{stats.activeNow}</p>
            <p className="app-subtext">Responding to requests</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Avg. Test Cases</p>
            <p className="text-3xl font-semibold text-slate-300">{stats.avgTestCases}</p>
            <p className="app-subtext">Per team member weekly average</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Members</h2>
              <div className="rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                Active {stats.activeNow}
              </div>
            </div>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 shadow-inner shadow-slate-900/50">
                  <div>
                    <p className="text-sm font-semibold text-white">{member.fullName}</p>
                    <p className="text-xs text-slate-400">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-slate-300">
                      {member.role}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{member.testCases}</p>
                      <p className="text-xs text-slate-500">{member.lastActive || 'Not available'}</p>
                    </div>
                    <span
                      className={`h-3 w-3 rounded-full ${member.status === 'online' ? 'bg-slate-400' : 'bg-slate-500'}`}
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={() => void handleDeleteMember(member.id)}
                      disabled={isDeletingMemberId === member.id}
                      className="rounded-full p-2 text-slate-500 transition hover:bg-slate-500/10 hover:text-slate-300 disabled:opacity-60"
                      aria-label={`Remove ${member.fullName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Recent Activity</p>
                  <h3 className="text-lg font-semibold text-white">What the team is doing</h3>
                </div>
                <Activity className="h-5 w-5 text-slate-300" />
              </header>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                {activity.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-white">
                      <span className="font-semibold">{item.actor}</span> {item.action}
                    </p>
                    <p className="text-xs text-slate-500">{item.timeLabel}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
              <header className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-white">Role permissions</h3>
              </header>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                {roles.map((role) => (
                  <div key={role.name} className="rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-3">
                    <p className="text-sm font-semibold text-white">{role.name}</p>
                    <p className="text-xs text-slate-400">{role.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {isInviteOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => setIsInviteOpen(false)}
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className="fixed right-0 top-0 z-50 h-screen w-full max-w-5xl overflow-y-auto border-l border-slate-800 bg-slate-950/95 px-5 py-5 shadow-[0_24px_90px_rgba(2,6,23,0.6)]"
                role="dialog"
                aria-modal="true"
                aria-label="Invite member"
              >
                <div className="mx-auto max-w-4xl space-y-6">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.36em] text-slate-200">Invite Flow</p>
                      <h2 className="mt-2 text-3xl font-semibold text-white">Invite New Member</h2>
                      <p className="mt-2 app-subtext max-w-2xl">
                        Add teammates with the right permissions, team ownership, and project visibility before they join the workspace.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInviteOpen(false)}
                      className="rounded-2xl border border-slate-700 bg-slate-900 p-3 text-slate-300 transition hover:border-slate-200/40 hover:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200/20"
                      aria-label="Close invite drawer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
                    <form onSubmit={handleInviteSubmit} className="space-y-6">
                      <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30">
                        <div className="mb-6 flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.36em] text-slate-200">Identity</p>
                            <h3 className="mt-2 text-xl font-semibold text-white">Member Details</h3>
                          </div>
                          <UserPlus2 className="h-5 w-5 text-slate-300" />
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-200">Full Name</span>
                            <input
                              value={inviteForm.fullName}
                              onChange={(event) => updateInviteForm('fullName', event.target.value)}
                              placeholder="Enter member full name"
                              className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-white focus:outline-none focus:ring-4 focus:ring-white/20"
                            />
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-200">Work Email</span>
                            <div className="relative">
                              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                              <input
                                value={inviteForm.email}
                                onChange={(event) => updateInviteForm('email', event.target.value)}
                                placeholder="name@company.com"
                                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 pl-11 text-sm text-slate-100 placeholder:text-slate-500 focus:border-white focus:outline-none focus:ring-4 focus:ring-white/20"
                              />
                            </div>
                          </label>
                        </div>
                      </section>

                      <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30">
                        <div className="mb-6">
                          <p className="text-xs uppercase tracking-[0.36em] text-slate-200">Access Setup</p>
                          <h3 className="mt-2 text-xl font-semibold text-white">Role, Team, and Scope</h3>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-200">Role</span>
                            <div className="relative">
                              <select
                                value={inviteForm.role}
                                onChange={(event) => updateInviteForm('role', event.target.value)}
                                className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-white focus:outline-none focus:ring-4 focus:ring-white/20"
                              >
                                {inviteRoles.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            </div>
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-200">Team</span>
                            <div className="relative">
                              <select
                                value={inviteForm.team}
                                onChange={(event) => updateInviteForm('team', event.target.value)}
                                className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-white focus:outline-none focus:ring-4 focus:ring-white/20"
                              >
                                {inviteTeams.map((team) => (
                                  <option key={team} value={team}>
                                    {team}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            </div>
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-200">Primary Project</span>
                            <div className="relative">
                              <select
                                value={inviteForm.project}
                                onChange={(event) => updateInviteForm('project', event.target.value)}
                                className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-white focus:outline-none focus:ring-4 focus:ring-white/20"
                              >
                                {inviteProjects.map((project) => (
                                  <option key={project} value={project}>
                                    {project}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            </div>
                          </label>
                          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                            <p className="text-sm font-medium text-slate-200">Seat Summary</p>
                            <p className="mt-2 app-subtext">1 invite will consume 1 active workspace seat once accepted.</p>
                            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-500/20 bg-slate-500/10 px-4 py-3 text-sm text-slate-300">
                              <Users className="h-4 w-4" />
                              8 of 12 seats currently used
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 space-y-3">
                          <p className="text-sm font-medium text-slate-200">Access Preset</p>
                          <div className="grid gap-3">
                            {accessPresets.map((preset) => {
                              const selected = inviteForm.accessPreset === preset.id
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => updateInviteForm('accessPreset', preset.id)}
                                  className={`rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-white/20 ${
                                    selected
                                      ? 'border-white/40 bg-white/10'
                                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <p className="text-sm font-semibold text-white">{preset.name}</p>
                                      <p className="mt-1 app-subtext">{preset.description}</p>
                                    </div>
                                    {selected ? <CheckCircle2 className="h-5 w-5 text-slate-300" /> : null}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </section>

                      <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30">
                        <div className="mb-4">
                          <p className="text-xs uppercase tracking-[0.36em] text-slate-200">Delivery</p>
                          <h3 className="mt-2 text-xl font-semibold text-white">Invite Preferences</h3>
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-white">Send invite copy to me</p>
                              <p className="app-subtext">Keep a record of the invitation in your inbox.</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={inviteForm.sendCopy}
                              onChange={(event) => updateInviteForm('sendCopy', event.target.checked)}
                              className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-white focus:ring-white/30"
                            />
                          </label>
                          <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-white">Include onboarding welcome note</p>
                              <p className="app-subtext">Attaches quick links to projects, docs, and coverage dashboards.</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={inviteForm.addWelcomeNote}
                              onChange={(event) => updateInviteForm('addWelcomeNote', event.target.checked)}
                              className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-white focus:ring-white/30"
                            />
                          </label>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                          <Button type="button" variant="outline" size="md" onClick={() => setIsInviteOpen(false)} className="w-full rounded-2xl">
                            Cancel
                          </Button>
                          <Button type="submit" size="md" isLoading={isSubmittingInvite} className="w-full rounded-2xl">
                            Send Invite
                          </Button>
                        </div>
                      </section>
                    </form>

                    <div className="space-y-6">
                      <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.36em] text-slate-200">Invite Preview</p>
                            <h3 className="mt-2 text-xl font-semibold text-white">Member Snapshot</h3>
                          </div>
                          <Sparkles className="h-5 w-5 text-slate-300" />
                        </div>

                        <div className="mt-5 rounded-[24px] border border-slate-800 bg-slate-950/50 p-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-black to-slate-800 text-lg font-semibold text-white">
                              {(inviteForm.fullName || 'TM')
                                .split(' ')
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-white">{inviteForm.fullName || 'Teammate Name'}</p>
                              <p className="app-subtext">{inviteForm.email || 'member@company.com'}</p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Role</p>
                              <p className="mt-2 text-sm font-semibold text-white">{inviteForm.role}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Team & Project</p>
                              <p className="mt-2 text-sm font-semibold text-white">{inviteForm.team}</p>
                              <p className="app-subtext">{inviteForm.project || 'No project selected yet'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Access Level</p>
                              <p className="mt-2 text-sm font-semibold text-white">{selectedAccess.name}</p>
                              <p className="app-subtext">{selectedAccess.description}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Role Access</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {selectedRoleAccess.map((item) => (
                                  <span key={item} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-slate-300">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30">
                        <header className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-slate-400" />
                          <h3 className="text-lg font-semibold text-white">What happens next</h3>
                        </header>
                        <ul className="mt-4 space-y-3">
                          {[
                            'An invite email is sent instantly with workspace access details.',
                            'The new member lands on the assigned team and project by default.',
                            'Admins can still edit role permissions after acceptance.',
                          ].map((item) => (
                            <li key={item} className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </section>

                      <AnimatePresence>
                        {inviteSent ? (
                          <motion.section
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 12 }}
                            className="rounded-[28px] border border-slate-500/20 bg-slate-500/10 p-6"
                          >
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="mt-0.5 h-5 w-5 text-slate-300" />
                              <div>
                                <p className="text-sm font-semibold text-white">Invite sent successfully</p>
                                <p className="mt-1 text-sm text-slate-200/80">
                                  {inviteForm.fullName || 'Your teammate'} will receive access to {inviteForm.project} as {inviteForm.role}.
                                </p>
                              </div>
                            </div>
                          </motion.section>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
