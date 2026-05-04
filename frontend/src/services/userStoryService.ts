import axios from 'axios'
import { config } from '@/utils/config'

export type UserStoryPriority = 'High' | 'Medium' | 'Low'
export type UserStoryStatus = 'Backlog' | 'In Progress' | 'QA Review' | 'Done'

export type UserStoryRecord = {
  id: number
  title?: string
  actor?: string
  goal: string
  description?: string
  benefit?: string
  acceptanceCriteria?: string
  priority: UserStoryPriority
  status: UserStoryStatus
  dueDate?: string
  assigneeId?: string
  assigneeName?: string
  attachmentNames?: string[]
  project?: {
    id: number
    name: string
  }
}

export type UserStoryPayload = {
  title: string
  userRole: string
  description: string
  priority: UserStoryPriority
  dueDate?: string
  assigneeId?: string
  assigneeName?: string
  attachmentNames?: string[]
  acceptanceCriteria?: string
  status?: UserStoryStatus
}

const userStoriesUrl = (projectId: number) => `${config.endpoints.projects}/${projectId}/user-stories`
const userStoryUrl = (projectId: number, storyId: number) => `${userStoriesUrl(projectId)}/${storyId}`

export const userStoryService = {
  async list(projectId: number) {
    const { data } = await axios.get<UserStoryRecord[]>(userStoriesUrl(projectId))
    return data
  },

  async create(projectId: number, payload: UserStoryPayload) {
    const { data } = await axios.post<UserStoryRecord>(userStoriesUrl(projectId), payload)
    return data
  },

  async update(projectId: number, storyId: number, payload: Partial<UserStoryPayload>) {
    const { data } = await axios.patch<UserStoryRecord>(userStoryUrl(projectId, storyId), payload)
    return data
  },

  async remove(projectId: number, storyId: number) {
    await axios.delete(userStoryUrl(projectId, storyId))
  },
}
