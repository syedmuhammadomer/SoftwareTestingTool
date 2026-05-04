import { User } from '@/types'

export type AppPermission =
  | '*'
  | 'dashboard:view'
  | 'projects:create'
  | 'projects:view_assigned'
  | 'user_stories:create'
  | 'test_cases:create'
  | 'documents:view'
  | 'backlogs:manage'
  | 'backlogs:view'
  | 'testing_status:update'
  | 'bugs:create'
  | 'stories_test_cases:link'
  | 'rtm:view'
  | 'team:manage'
  | 'sprints:plan'
  | 'stories:assign'
  | 'backlog:approve_priorities'
  | 'tickets:update_status'
  | 'tasks:move_backlog'
  | 'tasks:move_in_progress'
  | 'tasks:move_testing'
  | 'tasks:move_done'
  | 'comments:development'
  | 'implementation:update_progress'

export const routePermissions: Record<string, AppPermission[]> = {
  '/dashboard': ['dashboard:view'],
  '/projects': ['projects:view_assigned'],
  '/projects/new': ['projects:create'],
  '/backlogs': ['backlogs:manage', 'backlogs:view'],
  '/user-stories': ['user_stories:create'],
  '/test-manager': ['test_cases:create', 'testing_status:update'],
  '/rtm': ['rtm:view'],
  '/team': ['team:manage'],
  '/documents': ['documents:view'],
}

export const hasPermission = (user: User | null, permission: AppPermission) => {
  if (!user) return false
  if (user.permissions?.includes('*')) return true
  return user.permissions?.includes(permission) ?? false
}

export const canAccessRoute = (user: User | null, pathname: string) => {
  const required = routePermissions[pathname]
  if (!required) return true
  return required.some((permission) => hasPermission(user, permission))
}

export const getFirstAccessibleRoute = (user: User | null) => {
  const candidates = ['/dashboard', '/projects', '/backlogs', '/documents']
  return candidates.find((route) => canAccessRoute(user, route)) || '/dashboard'
}
