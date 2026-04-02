import { useState, useEffect, useCallback } from "react"

interface TestCase {
  id: string
  project_id: string
  prompt_version_id: string
  input_text: string
  expected_output: string | null
  created_at: string
}

interface UseTestCasesResult {
  testCases: TestCase[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  createTestCase: (prompt_version_id: string, input_text: string, expected_output?: string) => Promise<TestCase>
}

export function useTestCases(projectId: string): UseTestCasesResult {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTestCases = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/projects/${projectId}/test-cases`)
      if (!response.ok) {
        throw new Error(`Failed to fetch test cases: ${response.statusText}`)
      }
      const data = await response.json()
      setTestCases(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch test cases"))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const createTestCase = useCallback(async (prompt_version_id: string, input_text: string, expected_output?: string): Promise<TestCase> => {
    const response = await fetch(`/projects/${projectId}/test-cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt_version_id, input_text, expected_output }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create test case: ${response.statusText}`)
    }

    const newTestCase = await response.json()
    setTestCases((prev) => [...prev, newTestCase])
    return newTestCase
  }, [projectId])

  useEffect(() => {
    fetchTestCases()
  }, [fetchTestCases])

  return { testCases, isLoading, error, refetch: fetchTestCases, createTestCase }
}
