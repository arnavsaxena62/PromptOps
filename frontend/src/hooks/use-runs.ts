import { useState, useEffect, useCallback } from "react"

interface RunResult {
  id: string
  model_config_id: string
  model_name: string
  output_text: string
  latency_ms: number
  prompt_tokens: number
  response_tokens: number
  total_cost: number
  success: boolean
  error_message: string | null
}

interface Run {
  id: string
  project_id: string
  prompt_version_id: string
  input_text: string
  created_at: string
  results: RunResult[]
}

interface UseRunsResult {
  runs: Run[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  executeRun: (test_case_id: string, model_config_ids?: string[]) => Promise<Run>
}

export function useRuns(projectId: string): UseRunsResult {
  const [runs, setRuns] = useState<Run[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchRuns = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/projects/${projectId}/runs`)
      if (!response.ok) {
        throw new Error(`Failed to fetch runs: ${response.statusText}`)
      }
      const data = await response.json()
      setRuns(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch runs"))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const executeRun = useCallback(async (test_case_id: string, model_config_ids?: string[]): Promise<Run> => {
    const response = await fetch(`/projects/${projectId}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test_case_id, model_config_ids }),
    })

    if (!response.ok) {
      throw new Error(`Failed to execute run: ${response.statusText}`)
    }

    const newRun = await response.json()
    setRuns((prev) => [newRun, ...prev])
    return newRun
  }, [projectId])

  useEffect(() => {
    fetchRuns()
  }, [fetchRuns])

  return { runs, isLoading, error, refetch: fetchRuns, executeRun }
}
