import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useProjects } from "@/hooks/use-projects"
import { usePromptVersions } from "@/hooks/use-prompt-versions"
import { useModelConfigs } from "@/hooks/use-model-configs"
import { useTestCases } from "@/hooks/use-test-cases"
import { useRuns } from "@/hooks/use-runs"
import {
  ArrowLeft,
  Beaker,
  Cpu,
  FileText,
  FlaskConical,
  Loader2,
  Play,
  Plus,
  Zap,
} from "lucide-react"

interface Project {
  id: string
  name: string
  prompt_version_count: number
  model_config_count: number
  test_case_count: number
  run_count: number
}

export default function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { projects } = useProjects()
  const { versions, createVersion } = usePromptVersions(projectId!)
  const { configs, createConfig } = useModelConfigs(projectId!)
  const { testCases, createTestCase } = useTestCases(projectId!)
  const { runs, executeRun } = useRuns(projectId!)

  // Prompt editor state
  const [promptContent, setPromptContent] = useState("")
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const selectedVersion = versions.find((v) => v.id === selectedVersionId)
  const isPromptEdited = selectedVersion ? promptContent !== selectedVersion.content : promptContent.trim().length > 0

  // Test case selection
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState<Set<string>>(new Set())

  // Model selection
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set())

  // Dialogs
  const [isNewTestCaseOpen, setIsNewTestCaseOpen] = useState(false)
  const [newTestCaseInput, setNewTestCaseInput] = useState("")
  const [newTestCaseExpected, setNewTestCaseExpected] = useState("")
  const [isCreatingTestCase, setIsCreatingTestCase] = useState(false)

  const [isNewModelOpen, setIsNewModelOpen] = useState(false)
  const [newModelProvider, setNewModelProvider] = useState("")
  const [newModelName, setNewModelName] = useState("")
  const [isCreatingModel, setIsCreatingModel] = useState(false)

  const [isRunning, setIsRunning] = useState(false)

  // Fetch project details
  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/projects/${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setProject(data)
        }
      } catch (err) {
        console.error("Failed to fetch project:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProject()
  }, [projectId])

  // Set initial prompt content from latest version
  useEffect(() => {
    if (versions.length > 0 && !selectedVersionId) {
      const latest = versions.sort((a, b) => b.version_number - a.version_number)[0]
      setSelectedVersionId(latest.id)
      setPromptContent(latest.content)
    }
  }, [versions, selectedVersionId])

  const handleVersionChange = (versionId: string) => {
    const version = versions.find((v) => v.id === versionId)
    if (version) {
      setSelectedVersionId(versionId)
      setPromptContent(version.content)
    }
  }

  const handleSaveVersion = async () => {
    if (!promptContent.trim()) return
    setIsSaving(true)
    try {
      const nextVersion = versions.length > 0
        ? Math.max(...versions.map((v) => v.version_number)) + 1
        : 1
      await createVersion(nextVersion, promptContent)
    } catch (err) {
      console.error("Failed to save version:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateTestCase = async () => {
    if (!newTestCaseInput.trim() || !selectedVersionId) return
    setIsCreatingTestCase(true)
    try {
      await createTestCase(selectedVersionId, newTestCaseInput, newTestCaseExpected || undefined)
      setNewTestCaseInput("")
      setNewTestCaseExpected("")
      setIsNewTestCaseOpen(false)
    } catch (err) {
      console.error("Failed to create test case:", err)
    } finally {
      setIsCreatingTestCase(false)
    }
  }

  const handleCreateModel = async () => {
    if (!newModelProvider.trim() || !newModelName.trim()) return
    setIsCreatingModel(true)
    try {
      await createConfig(newModelProvider, newModelName)
      setNewModelProvider("")
      setNewModelName("")
      setIsNewModelOpen(false)
    } catch (err) {
      console.error("Failed to create model config:", err)
    } finally {
      setIsCreatingModel(false)
    }
  }

  const handleRun = async () => {
    if (selectedTestCaseIds.size === 0) return
    setIsRunning(true)
    try {
      const modelIds = selectedModelIds.size > 0 ? Array.from(selectedModelIds) : undefined
      for (const testCaseId of selectedTestCaseIds) {
        await executeRun(testCaseId, modelIds)
      }
    } catch (err) {
      console.error("Failed to execute run:", err)
    } finally {
      setIsRunning(false)
    }
  }

  const toggleTestCase = (id: string) => {
    setSelectedTestCaseIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleModel = (id: string) => {
    setSelectedModelIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Link to="/">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar projects={projects} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Project Header */}
      <header className="flex h-14 shrink-0 items-center border-b px-4">
        <Link to="/" className="mr-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{project.name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" />
              {project.prompt_version_count} prompts
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <FlaskConical className="h-3 w-3" />
              {project.test_case_count} tests
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Cpu className="h-3 w-3" />
              {project.model_config_count} models
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              {project.run_count} runs
            </Badge>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" onClick={handleRun} disabled={isRunning || selectedTestCaseIds.size === 0}>
            <Play className="mr-2 h-4 w-4" />
            {isRunning ? "Running..." : "Run Evaluation"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center Workspace */}
        <main className="flex-1 overflow-y-auto">
          <Tabs defaultValue="editor" className="h-full">
            <div className="border-b px-4">
              <TabsList className="h-10 w-auto justify-start rounded-none bg-transparent p-0">
                <TabsTrigger value="editor" className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  <FileText className="mr-2 h-4 w-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="tests" className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  <Beaker className="mr-2 h-4 w-4" />
                  Test Cases
                </TabsTrigger>
                <TabsTrigger value="runs" className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  <Zap className="mr-2 h-4 w-4" />
                  Runs
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Prompt Editor Tab */}
            <TabsContent value="editor" className="m-0 p-4">
              <div className="flex flex-col gap-4">
                {/* Version Selector + Save Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Version</Label>
                    <select
                      value={selectedVersionId || ""}
                      onChange={(e) => handleVersionChange(e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="">Select version...</option>
                      {versions
                        .sort((a, b) => b.version_number - a.version_number)
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            v{v.version_number} — {new Date(v.created_at).toLocaleDateString()}
                          </option>
                        ))}
                    </select>
                  </div>
                  <Button size="sm" onClick={handleSaveVersion} disabled={isSaving || !isPromptEdited}>
                    <Plus className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save as New Version"}
                  </Button>
                </div>

                {/* Editor */}
                <Textarea
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder="Write your prompt here..."
                  className="min-h-[300px] resize-y font-mono text-sm"
                />
              </div>
            </TabsContent>

            {/* Test Cases Tab */}
            <TabsContent value="tests" className="m-0 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Test Cases</h3>
                  <p className="text-xs text-muted-foreground">
                    Select test cases to include in your evaluation run
                  </p>
                </div>
                <Dialog open={isNewTestCaseOpen} onOpenChange={setIsNewTestCaseOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Test Case
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Test Case</DialogTitle>
                      <DialogDescription>
                        Define input and expected output for evaluation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="input">Input Text</Label>
                        <Textarea
                          id="input"
                          value={newTestCaseInput}
                          onChange={(e) => setNewTestCaseInput(e.target.value)}
                          placeholder="Enter test input..."
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="expected">Expected Output (optional)</Label>
                        <Textarea
                          id="expected"
                          value={newTestCaseExpected}
                          onChange={(e) => setNewTestCaseExpected(e.target.value)}
                          placeholder="Enter expected output..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsNewTestCaseOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateTestCase} disabled={isCreatingTestCase || !newTestCaseInput.trim()}>
                        {isCreatingTestCase ? "Creating..." : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2">
                  {testCases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FlaskConical className="h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No test cases yet</p>
                    </div>
                  ) : (
                    testCases.map((tc) => (
                      <Card
                        key={tc.id}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-accent/50",
                          selectedTestCaseIds.has(tc.id) && "border-primary bg-accent/30"
                        )}
                        onClick={() => toggleTestCase(tc.id)}
                      >
                        <CardContent className="flex items-start gap-3 p-3">
                          <Checkbox
                            checked={selectedTestCaseIds.has(tc.id)}
                            onCheckedChange={() => toggleTestCase(tc.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">Input</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{tc.input_text}</p>
                            {tc.expected_output && (
                              <>
                                <p className="text-sm font-medium">Expected</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{tc.expected_output}</p>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Runs Tab */}
            <TabsContent value="runs" className="m-0 p-4">
              {/* Run Panel */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Run Evaluation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Prompt Version</p>
                      <p className="font-medium">
                        {selectedVersionId
                          ? `v${versions.find((v) => v.id === selectedVersionId)?.version_number || "?"}`
                          : "None selected"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Models</p>
                      <p className="font-medium">
                        {selectedModelIds.size > 0
                          ? `${selectedModelIds.size} selected`
                          : `All ${configs.length} models`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Test Cases</p>
                      <p className="font-medium">
                        {selectedTestCaseIds.size > 0
                          ? `${selectedTestCaseIds.size} selected`
                          : "None selected"}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    onClick={handleRun}
                    disabled={isRunning || selectedTestCaseIds.size === 0}
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Run Evaluation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Runs */}
              <div>
                <h3 className="mb-3 text-sm font-medium">Recent Runs</h3>
                <ScrollArea className="h-[calc(100vh-450px)]">
                  {runs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Zap className="h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No runs yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {runs.map((run) => (
                        <Link key={run.id} to={`/project/${projectId}/run/${run.id}`}>
                          <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                            <CardContent className="flex items-center gap-4 p-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <Zap className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {new Date(run.created_at).toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {run.results.length} model{run.results.length !== 1 ? "s" : ""} • {run.results.filter((r) => r.success).length} succeeded
                                </p>
                              </div>
                              <Badge variant={run.results.every((r) => r.success) ? "default" : "destructive"}>
                                {run.results.every((r) => r.success) ? "Passed" : "Failed"}
                              </Badge>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Sidebar: Model Configs */}
        <aside className="w-72 border-l">
          <div className="flex h-10 items-center justify-between border-b px-4">
            <h2 className="text-sm font-medium">Model Configs</h2>
            <Dialog open={isNewModelOpen} onOpenChange={setIsNewModelOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Model</DialogTitle>
                  <DialogDescription>
                    Configure a model for evaluation.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Input
                      id="provider"
                      value={newModelProvider}
                      onChange={(e) => setNewModelProvider(e.target.value)}
                      placeholder="e.g., openai, anthropic"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model-name">Model Name</Label>
                    <Input
                      id="model-name"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      placeholder="e.g., gpt-4, claude-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewModelOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateModel} disabled={isCreatingModel || !newModelProvider.trim() || !newModelName.trim()}>
                    {isCreatingModel ? "Adding..." : "Add Model"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-2">
              {configs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Cpu className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-xs text-muted-foreground">No models configured</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {configs.map((config) => (
                    <div
                      key={config.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent",
                        selectedModelIds.has(config.id) && "bg-accent"
                      )}
                      onClick={() => toggleModel(config.id)}
                    >
                      <Checkbox
                        checked={selectedModelIds.has(config.id)}
                        onCheckedChange={() => toggleModel(config.id)}
                      />
                      <div className="flex-1 truncate">
                        <p className="text-sm font-medium">{config.model_name}</p>
                        <p className="text-xs text-muted-foreground">{config.provider}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>
      </div>
    </div>
  )
}
