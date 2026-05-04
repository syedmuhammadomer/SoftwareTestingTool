import axios from 'axios'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { config } from '@/utils/config'

type FeatureItem = {
  title: string
  description?: string
}

export type UserStoryItem = {
  id?: number
  title?: string
  actor: string
  goal: string
  description?: string
  benefit?: string
  acceptanceCriteria?: string
  priority?: 'High' | 'Medium' | 'Low'
  status?: 'Backlog' | 'In Progress' | 'QA Review' | 'Done'
  dueDate?: string
  assigneeId?: string
  assigneeName?: string
  attachmentNames?: string[]
}

export type TestCaseItem = {
  id?: number
  testCaseId: string
  title: string
  preconditions?: string
  steps?: string
  expectedResult?: string
}

type RtmEntry = {
  requirementId: string
  description: string
  linkedUserStories?: string[]
  linkedTestCases?: string[]
}

type ProjectAiResponse = {
  summary?: string
}

export type ProjectRecord = {
  id: number
  name: string
  status: string
  failureReason?: string
  progress?: number
  features?: FeatureItem[]
  userStories?: UserStoryItem[]
  testCases?: TestCaseItem[]
  rtm?: RtmEntry[]
  aiResponse?: ProjectAiResponse
  createdAt?: string
  updatedAt?: string
}

type ProjectContextValue = {
  projects: ProjectRecord[]
  selectedProjectId: number | null
  selectedProject: ProjectRecord | null
  loading: boolean
  error: string | null
  setSelectedProjectId: (projectId: number) => void
  reloadProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

const STORAGE_KEY = 'selectedProjectId'

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [selectedProjectId, setSelectedProjectIdState] = useState<number | null>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setSelectedProjectId = useCallback((projectId: number) => {
    if (!Number.isFinite(projectId)) {
      return
    }
    setSelectedProjectIdState(projectId)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(projectId))
    }
  }, [])

  const reloadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<ProjectRecord[]>(config.endpoints.projects)
      const storedUser =
        typeof window !== 'undefined' ? localStorage.getItem('userData') : null
      const parsedUser = storedUser
        ? (JSON.parse(storedUser) as { assignedProject?: string | null; permissions?: string[] })
        : null
      const nextProjects =
        parsedUser?.permissions?.includes('*') || !parsedUser?.assignedProject
          ? response.data
          : response.data.filter((project) => project.name === parsedUser.assignedProject)
      setProjects(nextProjects)

      setSelectedProjectIdState((currentId) => {
        const storedId =
          typeof window !== 'undefined' ? Number(localStorage.getItem(STORAGE_KEY) || '') : NaN
        const preferredId = currentId ?? (Number.isNaN(storedId) ? null : storedId)

        if (preferredId != null && nextProjects.some((project) => project.id === preferredId)) {
          return preferredId
        }

        const fallbackId = nextProjects[0]?.id ?? null
        if (typeof window !== 'undefined') {
          if (fallbackId == null) {
            localStorage.removeItem(STORAGE_KEY)
          } else {
            localStorage.setItem(STORAGE_KEY, String(fallbackId))
          }
        }
        return fallbackId
      })
    } catch (loadError) {
      console.error('Failed to load projects for selector', loadError)
      setError('Unable to load projects right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reloadProjects()
  }, [reloadProjects])

  useEffect(() => {
    if (selectedProjectId == null) {
      setSelectedProject(null)
      return
    }

    const fallbackProject = projects.find((project) => project.id === selectedProjectId) ?? null
    setSelectedProject(fallbackProject)

    let isCancelled = false

    const loadSelectedProject = async () => {
      try {
        const response = await axios.get<ProjectRecord>(`${config.endpoints.projects}/${selectedProjectId}`)
        if (!isCancelled) {
          setSelectedProject(response.data)
        }
      } catch (loadError) {
        console.error('Failed to load selected project details', loadError)
      }
    }

    void loadSelectedProject()

    return () => {
      isCancelled = true
    }
  }, [projects, selectedProjectId])

  const value = useMemo(
    () => ({
      projects,
      selectedProjectId,
      selectedProject,
      loading,
      error,
      setSelectedProjectId,
      reloadProjects,
    }),
    [projects, selectedProjectId, selectedProject, loading, error, setSelectedProjectId, reloadProjects],
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjectContext must be used within ProjectProvider')
  }
  return context
}
