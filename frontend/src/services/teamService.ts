import axios from 'axios'
import { config } from '@/utils/config'

export type TeamMemberStatus = 'online' | 'offline' | 'invited'

export type TeamMemberRecord = {
  id: number
  fullName: string
  email: string
  role: string
  team: string
  project?: string
  testCases: number
  accessPreset?: string
  sendCopy: boolean
  addWelcomeNote: boolean
  status: TeamMemberStatus
  lastActive?: string
}

export type TeamActivityRecord = {
  id: number
  actor: string
  action: string
  timeLabel: string
}

export type TeamDashboardResponse = {
  stats: {
    totalMembers: number
    activeNow: number
    avgTestCases: number
  }
  members: TeamMemberRecord[]
  activity: TeamActivityRecord[]
  roles: Array<{ name: string; desc: string }>
}

export type InviteTeamMemberPayload = {
  fullName: string
  email: string
  role: string
  team: string
  project?: string
  accessPreset: 'full' | 'project' | 'review'
  sendCopy: boolean
  addWelcomeNote: boolean
}

export const teamService = {
  async getDashboard() {
    const { data } = await axios.get<TeamDashboardResponse>(`${config.apiBaseUrl}/api/team`)
    return data
  },

  async inviteMember(payload: InviteTeamMemberPayload) {
    const { data } = await axios.post<TeamMemberRecord>(`${config.apiBaseUrl}/api/team/invite`, payload)
    return data
  },

  async deleteMember(memberId: number) {
    await axios.delete(`${config.apiBaseUrl}/api/team/members/${memberId}`)
  },
}
