import React from 'react'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden="true" />
}

function AppShellSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="hidden w-64 border-r border-slate-800 bg-slate-900 lg:block">
        <div className="space-y-6 p-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full rounded-lg" />
            ))}
          </div>
          <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          </div>
        </div>
      </aside>
      <div className="flex-1">
        <div className="sticky top-0 border-b border-slate-800 bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
          <Skeleton className="h-7 w-40 rounded-md" />
        </div>
        <main className="space-y-6 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <AppShellSkeleton>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-2">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-3/4 rounded-md" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <Skeleton className="h-5 w-32 rounded-md" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </AppShellSkeleton>
  )
}

export function ProjectsPageSkeleton() {
  return (
    <AppShellSkeleton>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-full rounded-md" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, statIndex) => (
                <Skeleton key={statIndex} className="h-14 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>
        ))}
      </div>
    </AppShellSkeleton>
  )
}

export function TeamPageSkeleton() {
  return (
    <AppShellSkeleton>
      <div className="space-y-8 p-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-9 w-52 rounded-md" />
            <Skeleton className="h-4 w-80 rounded-md" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </AppShellSkeleton>
  )
}

export function BoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
      </div>
      <div className="grid min-h-[600px] grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, columnIndex) => (
          <div key={columnIndex} className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-6 w-8 rounded-md" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, cardIndex) => (
                <div key={cardIndex} className="space-y-3 rounded-lg border border-slate-700/50 bg-slate-800/70 p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-slate-950">
      <div className="grid grid-cols-12 gap-4 border-b border-slate-800 bg-slate-950/80 px-6 py-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="col-span-2 h-3 rounded-md" />
        ))}
      </div>
      <div className="space-y-1 p-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 rounded-xl px-4 py-4">
            <Skeleton className="col-span-3 h-10 rounded-lg" />
            <Skeleton className="col-span-4 h-10 rounded-lg" />
            <Skeleton className="col-span-2 h-10 rounded-lg" />
            <Skeleton className="col-span-2 h-10 rounded-lg" />
            <Skeleton className="col-span-1 h-10 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function StoryListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-4 rounded-[24px] border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Skeleton className="h-6 w-2/5 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </div>
      ))}
    </div>
  )
}
