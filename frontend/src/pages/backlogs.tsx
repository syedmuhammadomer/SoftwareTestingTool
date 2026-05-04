import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Backlogs from '@/components/Backlogs'
import { useProjectContext } from '@/context/ProjectContext'
import PageLoading from '@/components/PageLoading'

export default function BacklogsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const { selectedProject, loading: projectsLoading } = useProjectContext()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return <PageLoading kind="board" />
  }

  return (
    <Layout>
      <Backlogs selectedProject={selectedProject} isLoading={projectsLoading} />
    </Layout>
  )
}
