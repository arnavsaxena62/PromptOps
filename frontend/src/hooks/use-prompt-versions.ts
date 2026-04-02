import { useState, useEffect, useCallback } from "react"

interface PromptVersion {
  id: string
  project_id: string
  version_number: number
  content: string
  created_at: string
}

interface UsePromptVersionsResult {
  versions: PromptVersion[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  createVersion: (version_number: number, content: string) => Promise<PromptVersion>
}

export function usePromptVersions(projectId: string): UsePromptVersionsResult {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchVersions = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/projects/${projectId}/prompt-versions`)
      if (!response.ok) {
        throw new Error(`Failed to fetch prompt versions: ${response.statusText}`)
      }
      const data = await response.json()
      setVersions(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch prompt versions"))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const createVersion = useCallback(async (version_number: number, content: string): Promise<PromptVersion> => {
    const response = await fetch(`/projects/${projectId}/prompt-versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version_number, content }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create prompt version: ${response.statusText}`)
    }

    const newVersion = await response.json()
    setVersions((prev) => [...prev, newVersion])
    return newVersion
  }, [projectId])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  return { versions, isLoading, error, refetch: fetchVersions, createVersion }
}
