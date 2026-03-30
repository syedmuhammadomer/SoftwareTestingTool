import type { AppProps } from 'next/app'
import { ProjectProvider } from '@/context/ProjectContext'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ProjectProvider>
      <Component {...pageProps} />
    </ProjectProvider>
  )
}
