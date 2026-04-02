import { useState, useEffect, useMemo } from "react"
import { useParams, Link, useSearchParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar"
import { useProjects } from "@/hooks/use-projects"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  Check,
  Clock,
  Cpu,
  DollarSign,
  Loader2,
  MessageSquare,
  Timer,
  X,
  Zap,
} from "lucide-react"

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
  score: number
}

interface Run {
  id: string
  project_id: string
  prompt_version_id: string
  input_text: string
  created_at: string
  results: RunResult[]
}

export default function RunDetail() {
  const { projectId, runId } = useParams<{ projectId: string; runId: string }>()
  const [searchParams] = useSearchParams()
  const { projects } = useProjects()
  const [runs, setRuns] = useState<Run[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)

  const batchRunIds = useMemo(() => {
    return searchParams.get("batch")?.split(",").filter(Boolean) || []
  }, [searchParams])

  useEffect(() => {
    async function fetchRuns() {
      try {
        if (batchRunIds.length > 0) {
          const fetchedRuns: Run[] = []
          for (const id of batchRunIds) {
            const response = await fetch(`/projects/${projectId}/runs/${id}`)
            if (response.ok) {
              fetchedRuns.push(await response.json())
            }
          }
          setRuns(fetchedRuns)
        } else {
          const response = await fetch(`/projects/${projectId}/runs/${runId}`)
          if (response.ok) {
            const data = await response.json()
            setRuns([data])
          }
        }
      } catch (err) {
        console.error("Failed to fetch runs:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRuns()
  }, [projectId, runId, batchRunIds])

  const [activeRunId, setActiveRunId] = useState<string | null>(null)

  useEffect(() => {
    if (runs.length > 0 && !activeRunId) {
      setActiveRunId(runs[0].id)
    }
  }, [runs, activeRunId])

  const activeRun = runs.find((r) => r.id === activeRunId)

  useEffect(() => {
    if (activeRun && activeRun.results.length > 0) {
      setSelectedResultId(activeRun.results[0].id)
    }
  }, [activeRun])

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar projects={projects} />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="flex h-screen">
        <Sidebar projects={projects} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Run not found</p>
          <Link to={`/project/${projectId}`}>
            <Button variant="outline">Back to Project</Button>
          </Link>
        </div>
      </div>
    )
  }

  const selectedResult = activeRun?.results.find((r) => r.id === selectedResultId)
  const totalSuccess = runs.reduce((sum, r) => sum + r.results.filter((res) => res.success).length, 0)
  const totalResults = runs.reduce((sum, r) => sum + r.results.length, 0)

  return (
    <div className="flex h-screen">
      <Sidebar projects={projects} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center border-b px-4">
          <Link to={`/project/${projectId}`} className="mr-4">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Run Details</h1>
            <Badge variant={totalSuccess === totalResults ? "default" : "destructive"}>
              {totalSuccess === totalResults ? "Passed" : "Failed"}
            </Badge>
          </div>
          <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {runs[0] && new Date(runs[0].created_at).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="h-4 w-4" />
              {totalResults} model{totalResults !== 1 ? "s" : ""}
            </span>
            {runs.length > 1 && (
              <Badge variant="outline">{runs.length} test cases</Badge>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Test Cases List */}
          <div className="w-72 border-r">
            <div className="border-b p-4">
              <h2 className="text-sm font-medium">Test Cases</h2>
              <p className="text-xs text-muted-foreground">
                {runs.length} test case{runs.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <div className="p-2 space-y-1">
                {runs.map((run, index) => {
                  const runSuccess = run.results.filter((r) => r.success).length
                  return (
                    <button
                      key={run.id}
                      onClick={() => {
                        setActiveRunId(run.id)
                        setSelectedResultId(run.results[0]?.id || null)
                      }}
                      className={cn(
                        "w-full rounded-md p-3 text-left transition-colors hover:bg-accent",
                        activeRunId === run.id && "bg-accent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Test Case {index + 1}</span>
                        {runSuccess === run.results.length ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {run.input_text}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {runSuccess}/{run.results.length} succeeded
                      </p>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Model Results List */}
          <div className="w-72 border-r">
            <div className="border-b p-4">
              <h2 className="text-sm font-medium">Model Results</h2>
              {activeRun && (
                <p className="text-xs text-muted-foreground">
                  {activeRun.results.filter((r) => r.success).length}/{activeRun.results.length} succeeded
                </p>
              )}
            </div>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <div className="p-2 space-y-1">
                {activeRun?.results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedResultId(result.id)}
                    className={cn(
                      "w-full rounded-md p-3 text-left transition-colors hover:bg-accent",
                      selectedResultId === result.id && "bg-accent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{result.model_name}</span>
                      {result.success ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {result.latency_ms.toFixed(0)}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${result.total_cost.toFixed(4)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Detail View */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Input */}
            {activeRun && (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Input
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{activeRun.input_text}</pre>
                </CardContent>
              </Card>
            )}

            {/* Selected Result */}
            {selectedResult && (
              <>
                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Output — {selectedResult.model_name}
                      </CardTitle>
                      <Badge variant={selectedResult.success ? "default" : "destructive"}>
                        {selectedResult.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedResult.error_message ? (
                      <p className="text-sm text-destructive">{selectedResult.error_message}</p>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm">{selectedResult.output_text}</pre>
                    )}
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Latency</p>
                      <p className="text-lg font-semibold">{selectedResult.latency_ms.toFixed(0)}ms</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Prompt Tokens</p>
                      <p className="text-lg font-semibold">{selectedResult.prompt_tokens}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Response Tokens</p>
                      <p className="text-lg font-semibold">{selectedResult.response_tokens}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Cost</p>
                      <p className="text-lg font-semibold">${selectedResult.total_cost.toFixed(4)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="text-lg font-semibold">{selectedResult.score}</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
