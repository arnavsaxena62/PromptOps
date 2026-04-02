import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
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
  const { projects } = useProjects()
  const [run, setRun] = useState<Run | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRun() {
      try {
        const response = await fetch(`/projects/${projectId}/runs/${runId}`)
        if (response.ok) {
          const data = await response.json()
          setRun(data)
          if (data.results.length > 0) {
            setSelectedResultId(data.results[0].id)
          }
        }
      } catch (err) {
        console.error("Failed to fetch run:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRun()
  }, [projectId, runId])

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

  if (!run) {
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

  const selectedResult = run.results.find((r) => r.id === selectedResultId)
  const successCount = run.results.filter((r) => r.success).length

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
            <Badge variant={successCount === run.results.length ? "default" : "destructive"}>
              {successCount === run.results.length ? "Passed" : "Failed"}
            </Badge>
          </div>
          <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(run.created_at).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="h-4 w-4" />
              {run.results.length} model{run.results.length !== 1 ? "s" : ""}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Results List */}
          <div className="w-80 border-r">
            <div className="border-b p-4">
              <h2 className="text-sm font-medium">Model Results</h2>
              <p className="text-xs text-muted-foreground">
                {successCount}/{run.results.length} succeeded
              </p>
            </div>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <div className="p-2 space-y-1">
                {run.results.map((result) => (
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
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Input
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm">{run.input_text}</pre>
              </CardContent>
            </Card>

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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
