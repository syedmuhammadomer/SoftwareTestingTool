import React from 'react'
import {
  BoardSkeleton,
  DashboardPageSkeleton,
  ProjectsPageSkeleton,
  TeamPageSkeleton,
} from './Skeleton'

type PageLoadingProps = {
  kind: 'dashboard' | 'projects' | 'board' | 'team'
}

export default function PageLoading({ kind }: PageLoadingProps) {
  if (kind === 'dashboard') {
    return <DashboardPageSkeleton />
  }

  if (kind === 'projects') {
    return <ProjectsPageSkeleton />
  }

  if (kind === 'team') {
    return <TeamPageSkeleton />
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="hidden w-64 border-r border-slate-800 bg-slate-900 lg:block" />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <BoardSkeleton />
      </div>
    </div>
  )
}
