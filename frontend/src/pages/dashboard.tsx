import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import {
  User, FileText, Zap,
  FolderOpen, Sparkles, TestTube, Users,
  AlertTriangle, CheckCircle, XCircle, Clock, Upload, X, ClipboardList
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { ProjectRecord, useProjectContext } from '@/context/ProjectContext'

interface DashboardStats {
  totalProjects: number
  testCasesGenerated: number
  scenariosGenerated: number
  requirementsProcessed: number
  aiUsageRemaining: number
  riskScore: number
}

interface RecentActivity {
  id: string
  type: 'project' | 'test' | 'scenario' | 'requirement'
  title: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

interface TeamActivity {
  id: string
  user: string
  action: string
  timestamp: string
}

// Mock data for dashboard
const mockRecentActivity: RecentActivity[] = [
  { id: '1', type: 'project', title: 'Created new project: E-commerce Platform', timestamp: '2 hours ago', status: 'success' },
  { id: '2', type: 'test', title: 'Generated 45 test cases for login flow', timestamp: '4 hours ago', status: 'success' },
  { id: '3', type: 'scenario', title: 'AI generated checkout scenarios', timestamp: '6 hours ago', status: 'warning' },
  { id: '4', type: 'requirement', title: 'Processed user authentication requirements', timestamp: '1 day ago', status: 'success' },
  { id: '5', type: 'project', title: 'Failed to generate test cases for complex workflow', timestamp: '1 day ago', status: 'error' },
]

const mockTeamActivity: TeamActivity[] = [
  { id: '1', user: 'Sarah Johnson', action: 'completed test case review', timestamp: '30 min ago' },
  { id: '2', user: 'Mike Chen', action: 'generated 23 new scenarios', timestamp: '1 hour ago' },
  { id: '3', user: 'Emma Davis', action: 'updated project requirements', timestamp: '2 hours ago' },
  { id: '4', user: 'Alex Rodriguez', action: 'created new test suite', timestamp: '3 hours ago' },
]

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [recentActivity] = useState<RecentActivity[]>(mockRecentActivity)
  const [teamActivity] = useState<TeamActivity[]>(mockTeamActivity)
  const { projects, selectedProject, setSelectedProjectId, reloadProjects } = useProjectContext()

  // New Project Modal State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [srsFile, setSrsFile] = useState<File | null>(null)
  const [isSubmittingProject, setIsSubmittingProject] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [serverError, setServerError] = useState('')
  const [projectResult, setProjectResult] = useState<ProjectRecord | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

  const stats = useMemo<DashboardStats>(() => {
    const totalProjects = projects.length
    const testCasesGenerated = projects.reduce((total, project) => total + (project.testCases?.length ?? 0), 0)
    const scenariosGenerated = projects.reduce((total, project) => total + (project.userStories?.length ?? 0), 0)
    const requirementsProcessed = projects.reduce((total, project) => total + (project.rtm?.length ?? 0), 0)
    const completedProjects = projects.filter((project) => project.status === 'completed').length

    return {
      totalProjects,
      testCasesGenerated,
      scenariosGenerated,
      requirementsProcessed,
      aiUsageRemaining: Math.max(0, 1000 - totalProjects * 25),
      riskScore: totalProjects === 0 ? 0 : Math.max(5, 100 - Math.round((completedProjects / totalProjects) * 100)),
    }
  }, [projects])

  const activeProject = projectResult ?? selectedProject


  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setProjectResult(selectedProject)
    setProcessingProgress(selectedProject?.progress ?? 0)
    if (selectedProject) {
      if (selectedProject.status === 'completed') {
        setProcessingMessage('Project data is ready for review.')
      } else if (selectedProject.status === 'failed') {
        setProcessingMessage('Project processing failed.')
      } else {
        setProcessingMessage(`Project is ${selectedProject.status}.`)
      }
    } else {
      setProcessingMessage('')
    }
  }, [selectedProject])

  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const startPollingProject = (projectId: number) => {
    clearPolling()
    setProcessingProgress(45)
    setProcessingMessage('AI engine is analyzing your SRS...')

    const fetchStatus = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/projects/${projectId}`)
        const applyProgressValue = (value?: number) => {
          if (typeof value === 'number') {
            const normalized = Math.min(100, Math.max(0, value))
            setProcessingProgress((prev) => Math.max(prev, normalized))
            return normalized
          }
          setProcessingProgress((prev) => Math.min(99, prev + 5))
          return undefined
        }
        const progressValue = applyProgressValue(data.progress)
        setProjectResult(data)
        if (data.status === 'completed') {
          setProcessingProgress(100)
          setProcessingMessage('AI processing complete')
          await reloadProjects()
          clearPolling()
        } else if (data.status === 'failed') {
          setProcessingProgress(100)
          setProcessingMessage('AI processing failed')
          setServerError(data.failureReason || 'AI processing reported a failure')
          await reloadProjects()
          clearPolling()
        } else {
          setProcessingMessage(
            progressValue !== undefined
              ? `AI engine is analyzing your SRS (${progressValue}% complete)`
              : 'AI engine is analyzing your SRS...'
          )
        }
      } catch (error) {
        console.error('Project status poll failed', error)
        setServerError('Unable to reach the projects API for updates.')
        setProcessingMessage('Status polling paused')
        clearPolling()
      }
    }

    fetchStatus()
    pollingRef.current = setInterval(fetchStatus, 3000)
  }

  const handleProjectSubmission = async () => {
    if (!projectName.trim()) {
      setFormError('Project name is required')
      return
    }
    if (!srsFile) {
      setFormError('Please upload an SRS document')
      return
    }

    setFormError('')
    setServerError('')
    setProjectResult(null)
    setProcessingProgress(20)
    setProcessingMessage('Uploading SRS to our workspace...')
    setIsSubmittingProject(true)

    const formData = new FormData()
    formData.append('projectName', projectName.trim())
    formData.append('srsDocument', srsFile)

    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/projects`, formData)
      await reloadProjects()
      setSelectedProjectId(data.projectId)
      setProcessingProgress(35)
      startPollingProject(data.projectId)
      setIsNewProjectModalOpen(false)
      setProjectName('')
      setSrsFile(null)
    } catch (error) {
      console.error(error)
      setServerError('Unable to queue the project. Try again with a different document.')
      setProcessingProgress(0)
    } finally {
      setIsSubmittingProject(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <Layout>
      {/* Dashboard Content */}
      <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total Projects</p>
                  <p className="text-3xl font-bold text-white">{stats.totalProjects}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Test Cases Generated</p>
                  <p className="text-3xl font-bold text-white">{stats.testCasesGenerated.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TestTube className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Scenarios Generated</p>
                  <p className="text-3xl font-bold text-white">{stats.scenariosGenerated}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Requirements Processed</p>
                  <p className="text-3xl font-bold text-white">{stats.requirementsProcessed}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Second Row Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-slate-400 text-sm font-medium">AI Usage Remaining</p>
                  <p className="text-3xl font-bold text-white">{stats.aiUsageRemaining.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1">tokens this month</p>
                  {/* Pie Chart */}
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#374151"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="2"
                          strokeDasharray={`${(stats.aiUsageRemaining / 1000) * 100}, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-cyan-400">
                          {Math.round((stats.aiUsageRemaining / 1000) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                        <span className="text-xs text-slate-300">Remaining</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                        <span className="text-xs text-slate-300">Used</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-slate-400 text-sm font-medium">Risk Score</p>
                  <p className="text-3xl font-bold text-white">{stats.riskScore}%</p>
                  {/* Arrow Chart */}
                  <div className="mt-4">
                    <div className="relative w-full h-8 bg-slate-800 rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"></div>
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white transition-all duration-300"
                        style={{ left: `${stats.riskScore}%` }}
                      ></div>
                      <div
                        className="absolute -top-2 transition-all duration-300"
                        style={{ left: `calc(${stats.riskScore}% - 4px)` }}
                      >
                        <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white"></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Quick Actions</p>
                  <div className="mt-4 space-y-2">
                    <Button className="w-full justify-start" variant="outline" size="sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Tests
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsNewProjectModalOpen(true)}
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      New Project
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {serverError && (
            <div className="rounded-xl border border-rose-800 bg-rose-900/40 p-4 text-sm text-rose-200">
              {serverError}
            </div>
          )}

          {activeProject && (
            <section className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">Project insights</p>
                    <h3 className="text-2xl font-semibold text-white">{activeProject.name}</h3>
                    <p className="text-xs text-slate-400">Captured on {activeProject.createdAt ? new Date(activeProject.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${activeProject.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : activeProject.status === 'processing'
                        ? 'bg-cyan-500/10 text-cyan-300'
                        : 'bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    {activeProject.status.toUpperCase()}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
                {processingMessage && <p className="text-xs text-slate-400">{processingMessage}</p>}
                {activeProject.failureReason && (
                  <p className="text-xs text-rose-400">Failure note: {activeProject.failureReason}</p>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <ClipboardList className="w-5 h-5 text-cyan-400" />
                    <p className="text-sm font-semibold">Features &amp; Modules</p>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {(activeProject.features ?? []).length === 0 ? (
                      <p className="text-xs text-slate-500">No features extracted yet.</p>
                    ) : (
                      (activeProject.features ?? []).map((feature, index) => (
                        <div key={`feature-${index}`} className="space-y-1">
                          <p className="text-sm font-semibold text-white">{feature.title}</p>
                          <p className="text-xs text-slate-400">{feature.description || 'Description not available.'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">User Stories</p>
                      <span className="text-xs text-slate-400">{(activeProject.userStories ?? []).length} stories</span>
                    </div>
                    <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                      {(activeProject.userStories ?? []).length === 0 ? (
                        <p className="text-xs text-slate-500">No user stories generated yet.</p>
                      ) : (
                        (activeProject.userStories ?? []).map((story, index) => (
                          <div key={`story-${index}`} className="rounded-xl border border-slate-800 p-3 bg-slate-950/30">
                            <p className="text-xs text-cyan-300 uppercase tracking-wider">{story.actor}</p>
                            <p className="text-sm font-semibold text-white">{story.goal}</p>
                            {story.benefit && (
                              <p className="text-xs text-slate-400 italic mt-1">Benefit: {story.benefit}</p>
                            )}
                            {story.acceptanceCriteria && (
                              <p className="text-xs text-slate-400 mt-2">
                                Acceptance: {story.acceptanceCriteria}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Test Cases</p>
                      <span className="text-xs text-slate-400">{(activeProject.testCases ?? []).length} cases</span>
                    </div>
                    <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                      {(activeProject.testCases ?? []).length === 0 ? (
                        <p className="text-xs text-slate-500">No test cases generated yet.</p>
                      ) : (
                        (activeProject.testCases ?? []).map((testCase) => (
                          <div key={testCase.testCaseId} className="rounded-xl border border-slate-800 p-3 bg-slate-950/30">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-white">{testCase.title}</p>
                              <span className="text-xs text-slate-400">{testCase.testCaseId}</span>
                            </div>
                            {testCase.preconditions && (
                              <p className="text-xs text-slate-400 mt-1">Preconditions: {testCase.preconditions}</p>
                            )}
                            {testCase.steps && (
                              <p className="text-xs text-slate-400 mt-1">Steps: {testCase.steps}</p>
                            )}
                            {testCase.expectedResult && (
                              <p className="text-xs text-emerald-300 mt-1">Expected: {testCase.expectedResult}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-500">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-cyan-400" />
                    <span>Requirement Traceability Matrix</span>
                  </div>
                  <span>{(activeProject.rtm ?? []).length} entries</span>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {(activeProject.rtm ?? []).length === 0 ? (
                    <p className="text-xs text-slate-500">RTM entries will appear once test cases are generated.</p>
                  ) : (
                    (activeProject.rtm ?? []).map((entry) => (
                      <div key={entry.requirementId} className="rounded-xl border border-slate-800 p-3 bg-slate-950/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400">Requirement</p>
                          <span className="text-xs font-semibold text-cyan-300">{entry.requirementId}</span>
                        </div>
                        <p className="text-sm text-white">{entry.description}</p>
                        {entry.linkedUserStories?.length ? (
                          <p className="text-xs text-slate-400">Stories: {entry.linkedUserStories.join(', ')}</p>
                        ) : null}
                        {entry.linkedTestCases?.length ? (
                          <p className="text-xs text-slate-400">Test Cases: {entry.linkedTestCases.join(', ')}</p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {!activeProject && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
              Select a project from the dropdown next to the logo to view its user stories, RTM, test cases, and other details.
            </div>
          )}

          {/* Activity Feeds */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.status === 'success' ? 'bg-green-500/10' :
                      activity.status === 'warning' ? 'bg-yellow-500/10' : 'bg-red-500/10'
                    }`}>
                      {activity.status === 'success' ? (
                        <CheckCircle className={`w-4 h-4 ${
                          activity.status === 'success' ? 'text-green-400' :
                          activity.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                        }`} />
                      ) : activity.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{activity.title}</p>
                      <p className="text-xs text-slate-400">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Activity Feed */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Team Activity</h3>
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-4">
                {teamActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-slate-400">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-semibold text-white">Create New Project</h3>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {formError && (
                <p className="text-xs text-rose-400">{formError}</p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Banking Portal"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Upload SRS Document</label>
                <div className="relative group">
                  <div className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-all ${
                    srsFile
                      ? 'border-cyan-500/50 bg-cyan-500/5'
                      : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}>
                    <input
                      type="file"
                      onChange={(e) => setSrsFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept=".pdf,.doc,.docx"
                    />
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400 group-hover:text-slate-300">
                      <Upload className={`w-8 h-8 mb-3 ${srsFile ? 'text-cyan-400' : 'text-slate-500'}`} />
                      {srsFile ? (
                        <p className="text-sm font-medium text-cyan-400 truncate max-w-[220px]">
                          {srsFile.name}
                        </p>
                      ) : (
                        <>
                          <p className="mb-2 text-sm"><span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-slate-500">PDF, DOC, DOCX up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {processingMessage && (
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <p>{processingMessage}</p>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full">
                    <div
                      className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800 bg-slate-900/50">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewProjectModalOpen(false)
                  setFormError('')
                }}
                className="text-slate-300 hover:text-white"
                disabled={isSubmittingProject}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProjectSubmission}
                isLoading={isSubmittingProject}
                disabled={isSubmittingProject}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0"
              >
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
