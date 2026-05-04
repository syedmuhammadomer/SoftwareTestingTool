import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  ClipboardList,
  Pencil,
  PlusCircle,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import UserStoryForm from '@/components/UserStoryForm'
import { useProjectContext } from '@/context/ProjectContext'
import { handleApiError } from '@/utils/config'
import { userStoryService, UserStoryPayload, UserStoryRecord } from '@/services/userStoryService'
import { User } from '@/types'
import { hasPermission } from '@/utils/access'
import PageLoading from '@/components/PageLoading'
import { StoryListSkeleton } from '@/components/Skeleton'

export default function UserStoriesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [expandedStory, setExpandedStory] = useState<string | null>(null)
  const [stories, setStories] = useState<UserStoryRecord[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)
  const [storiesError, setStoriesError] = useState<string | null>(null)
  const [activeStory, setActiveStory] = useState<UserStoryRecord | null>(null)
  const [isDeletingStoryId, setIsDeletingStoryId] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const { selectedProject, selectedProjectId, reloadProjects, loading: projectsLoading } = useProjectContext()

  const backlogStories = useMemo(() => {
    return stories.map((story) => ({
      id: String(story.id),
      storyId: story.id,
      title: story.title || story.goal || `User story ${story.id}`,
      actor: story.actor || 'Unknown role',
      description: story.description || story.benefit || 'No description provided',
      acceptanceCriteria:
        story.acceptanceCriteria
          ?.split('\n')
          .map((item) => item.trim())
          .filter(Boolean) ?? [],
      priority: story.priority,
      status: story.status,
      dueDate: story.dueDate,
      assigneeName: story.assigneeName,
      attachmentNames: story.attachmentNames ?? [],
    }))
  }, [stories])

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

  const canManageStories = hasPermission(user, 'user_stories:create')

  useEffect(() => {
    if (!selectedProjectId) {
      setStories([])
      return
    }

    let ignore = false
    const loadStories = async () => {
      try {
        setStoriesLoading(true)
        setStoriesError(null)
        const nextStories = await userStoryService.list(selectedProjectId)
        if (!ignore) {
          setStories(nextStories)
        }
      } catch (error) {
        if (!ignore) {
          setStoriesError(handleApiError(error))
        }
      } finally {
        if (!ignore) {
          setStoriesLoading(false)
        }
      }
    }

    void loadStories()
    return () => {
      ignore = true
    }
  }, [selectedProjectId])

  const refreshStories = async () => {
    if (!selectedProjectId) {
      return
    }
    const nextStories = await userStoryService.list(selectedProjectId)
    setStories(nextStories)
    await reloadProjects()
  }

  const handleCreateStory = async (payload: UserStoryPayload) => {
    if (!selectedProjectId) {
      return
    }
    await userStoryService.create(selectedProjectId, payload)
    await refreshStories()
  }

  const handleUpdateStory = async (payload: UserStoryPayload) => {
    if (!selectedProjectId || !activeStory) {
      return
    }
    await userStoryService.update(selectedProjectId, activeStory.id, payload)
    await refreshStories()
  }

  const handleDeleteStory = async (storyId: number) => {
    if (!selectedProjectId) {
      return
    }
    setIsDeletingStoryId(storyId)
    try {
      await userStoryService.remove(selectedProjectId, storyId)
      await refreshStories()
      setExpandedStory((current) => (current === String(storyId) ? null : current))
    } finally {
      setIsDeletingStoryId(null)
    }
  }

  if (loading) {
    return <PageLoading kind="board" />
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top,#27272a_0%,#0f172a_42%,#020617_100%)] p-6 shadow-[0_24px_80px_rgba(8,15,30,0.45)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-200">Backlog Stories</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">User Stories</h1>
              <p className="mt-3 text-sm text-slate-300">
                Review every backlog story for the selected project, expand any row for details, and launch the creation drawer when you need a new one.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-200/20 bg-slate-200/10 px-4 py-2 text-sm text-slate-300">
                {selectedProject ? `${backlogStories.length} stories in backlog` : 'No project selected'}
              </div>
              {canManageStories ? (
                <Button onClick={() => setIsCreateOpen(true)} className="rounded-2xl bg-white hover:bg-slate-200">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create User Story
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {!selectedProject ? (
          <div className="rounded-[24px] border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-300">
            Select a project from the sidebar to load its backlog user stories here.
          </div>
        ) : projectsLoading || storiesLoading ? (
          <StoryListSkeleton />
        ) : storiesError ? (
          <div className="rounded-[24px] border border-slate-500/20 bg-slate-500/10 p-8 text-center text-slate-200">
            {storiesError}
          </div>
        ) : backlogStories.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200/10 text-slate-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">No backlog stories yet</h2>
            <p className="mt-2 app-subtext">
              Start with a new user story and it will appear here once your project data includes it.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {backlogStories.map((story, index) => {
              const isExpanded = expandedStory === story.id

              return (
                <motion.section
                  key={story.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="overflow-hidden rounded-[24px] border border-slate-800 bg-slate-900/70 shadow-[0_16px_50px_rgba(2,6,23,0.35)]"
                >
                  <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            story.priority === 'High'
                              ? 'bg-slate-500/10 text-slate-300'
                              : story.priority === 'Medium'
                                ? 'bg-slate-500/10 text-slate-300'
                                : 'bg-slate-500/10 text-slate-300'
                          }`}
                        >
                          {story.priority}
                        </span>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                          {story.status}
                        </span>
                      </div>

                      <h2 className="mt-4 text-xl font-semibold text-white">{story.title}</h2>
                      <p className="mt-2 app-subtext">
                        {story.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {canManageStories ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const original = stories.find((item) => item.id === story.storyId) ?? null
                              setActiveStory(original)
                              setIsEditOpen(true)
                            }}
                            className="flex items-center justify-center self-start rounded-2xl border border-slate-700 bg-slate-800/80 p-3 text-slate-300 transition hover:border-slate-200/40 hover:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200/20 md:self-center"
                            aria-label="Edit story"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteStory(story.storyId)}
                            disabled={isDeletingStoryId === story.storyId}
                            className="flex items-center justify-center self-start rounded-2xl border border-slate-500/20 bg-slate-500/10 p-3 text-slate-200 transition hover:border-slate-400/40 hover:text-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-400/20 disabled:opacity-60 md:self-center"
                            aria-label="Delete story"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setExpandedStory(isExpanded ? null : story.id)}
                        className="flex items-center justify-center self-start rounded-2xl border border-slate-700 bg-slate-800/80 p-3 text-slate-300 transition hover:border-slate-200/40 hover:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200/20 md:self-center"
                        aria-expanded={isExpanded}
                        aria-controls={`story-panel-${story.id}`}
                        aria-label={isExpanded ? 'Collapse story details' : 'Expand story details'}
                      >
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="h-5 w-5" />
                        </motion.div>
                      </button>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded ? (
                      <motion.div
                        id={`story-panel-${story.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden border-t border-slate-800"
                      >
                        <div className="grid gap-4 p-5 lg:grid-cols-3">
                          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                            <div className="flex items-center gap-2 text-slate-300">
                              <UserRound className="h-4 w-4" />
                              <h3 className="text-sm font-semibold">User Story</h3>
                            </div>
                            <p className="mt-3 text-sm leading-7 text-slate-300">
                              <span className="font-semibold text-white">{story.title}</span>
                              {' '}is for <span className="font-semibold text-white">{story.actor}</span>.
                              <br />
                              <span className="text-slate-300">{story.description}</span>
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                            <div className="flex items-center gap-2 text-slate-300">
                              <Target className="h-4 w-4" />
                              <h3 className="text-sm font-semibold">Acceptance Criteria</h3>
                            </div>
                            {story.acceptanceCriteria.length > 0 ? (
                              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                                {story.acceptanceCriteria.map((criterion) => (
                                  <li key={criterion} className="rounded-xl bg-slate-900 px-3 py-2">
                                    {criterion}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-3 app-subtext">No acceptance criteria were provided for this story.</p>
                            )}
                          </div>

                          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                            <div className="flex items-center gap-2 text-slate-300">
                              <ClipboardList className="h-4 w-4" />
                              <h3 className="text-sm font-semibold">Story Details</h3>
                            </div>
                            <dl className="mt-3 space-y-3 text-sm">
                              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2">
                                <dt className="text-slate-400">Project</dt>
                                <dd className="text-white">{selectedProject.name}</dd>
                              </div>
                              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2">
                                <dt className="text-slate-400">Status</dt>
                                <dd className="text-white">{story.status}</dd>
                              </div>
                              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2">
                                <dt className="text-slate-400">Priority</dt>
                                <dd className="text-white">{story.priority}</dd>
                              </div>
                              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2">
                                <dt className="text-slate-400">Due Date</dt>
                                <dd className="text-white">{story.dueDate || 'Not set'}</dd>
                              </div>
                              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2">
                                <dt className="text-slate-400">Assignee</dt>
                                <dd className="text-white">{story.assigneeName || 'Unassigned'}</dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.section>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCreateOpen && canManageStories ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setIsCreateOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
              className="fixed right-0 top-0 z-50 h-screen w-full max-w-4xl overflow-y-auto border-l border-slate-800 bg-slate-950/95 px-4 py-4 shadow-[0_24px_90px_rgba(2,6,23,0.6)] backdrop-blur xl:px-6"
              role="dialog"
              aria-modal="true"
              aria-label="Create user story"
            >
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-200">Create</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">New User Story</h2>
                  <p className="mt-2 app-subtext">
                    Build a backlog-ready story without leaving the user stories screen.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 p-3 text-slate-300 transition hover:border-slate-200/40 hover:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200/20"
                  aria-label="Close create user story drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <UserStoryForm
                mode="drawer"
                titleText="Create User Story"
                subtitleText="Build a backlog-ready story and save it directly to the selected project."
                onCancel={() => setIsCreateOpen(false)}
                onSubmitSuccess={() => setIsCreateOpen(false)}
                onSubmitStory={handleCreateStory}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isEditOpen && activeStory && canManageStories ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setIsEditOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
              className="fixed right-0 top-0 z-50 h-screen w-full max-w-4xl overflow-y-auto border-l border-slate-800 bg-slate-950/95 px-4 py-4 shadow-[0_24px_90px_rgba(2,6,23,0.6)] backdrop-blur xl:px-6"
              role="dialog"
              aria-modal="true"
              aria-label="Edit user story"
            >
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-200">Edit</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Update User Story</h2>
                  <p className="mt-2 app-subtext">
                    Keep backlog details accurate and synced with the project.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 p-3 text-slate-300 transition hover:border-slate-200/40 hover:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200/20"
                  aria-label="Close edit user story drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <UserStoryForm
                mode="drawer"
                titleText="Edit User Story"
                subtitleText="Update the selected story and save your changes to the backlog."
                submitLabel="Save Changes"
                initialValues={{
                  title: activeStory.title || activeStory.goal,
                  userRole: activeStory.actor || 'Admin',
                  description: activeStory.description || activeStory.benefit || '',
                  priority: activeStory.priority,
                  dueDate: activeStory.dueDate || '',
                  assigneeId: activeStory.assigneeId || '',
                }}
                onCancel={() => setIsEditOpen(false)}
                onSubmitSuccess={() => setIsEditOpen(false)}
                onSubmitStory={handleUpdateStory}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </Layout>
  )
}
