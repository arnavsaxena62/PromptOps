import { useState, useEffect, useCallback } from "react"

interface Project {
  id: string
  name: string
  prompt_version_count: number
  model_config_count: number
  test_case_count: number
  run_count: number
}

interface UseProjectsResult {
  projects: Project[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  createProject: (name: string) => Promise<Project>
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/projects`)
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`)
      }
      const data = await response.json()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch projects"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createProject = useCallback(async (name: string): Promise<Project> => {
    const response = await fetch(`/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.statusText}`)
    }

    const newProject = await response.json()
    setProjects((prev) => [...prev, newProject])
    return newProject
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
    createProject,
  }
}
