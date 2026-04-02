import { useState, useEffect, useCallback } from "react"

interface ModelConfig {
  id: string
  project_id: string
  provider: string
  model_name: string
  input_cost_per_token: number
  output_cost_per_token: number
}

interface UseModelConfigsResult {
  configs: ModelConfig[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  createConfig: (provider: string, model_name: string) => Promise<ModelConfig>
}

export function useModelConfigs(projectId: string): UseModelConfigsResult {
  const [configs, setConfigs] = useState<ModelConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchConfigs = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/projects/${projectId}/model-configs`)
      if (!response.ok) {
        throw new Error(`Failed to fetch model configs: ${response.statusText}`)
      }
      const data = await response.json()
      setConfigs(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch model configs"))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const createConfig = useCallback(async (provider: string, model_name: string): Promise<ModelConfig> => {
    const response = await fetch(`/projects/${projectId}/model-configs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model_name }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create model config: ${response.statusText}`)
    }

    const newConfig = await response.json()
    setConfigs((prev) => [...prev, newConfig])
    return newConfig
  }, [projectId])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  return { configs, isLoading, error, refetch: fetchConfigs, createConfig }
}
