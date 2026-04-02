import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ProjectGrid } from "@/components/project-grid"
import { useProjects } from "@/hooks/use-projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, RefreshCw } from "lucide-react"

function App() {
  const { projects, isLoading, error, refetch, createProject } = useProjects()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreateProject = async () => {
    if (!projectName.trim()) return

    setIsCreating(true)
    setCreateError(null)

    try {
      await createProject(projectName.trim())
      setProjectName("")
      setIsDialogOpen(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex h-screen dark">
      {/* Sidebar */}
      <Sidebar projects={projects} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background">
          <div className="flex h-14 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold">Projects</h1>
              <p className="text-sm text-muted-foreground">
                Manage your projects and workflows
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Enter a name for your new project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="My Project"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCreateProject()
                          }
                        }}
                      />
                    </div>
                    {createError && (
                      <p className="text-sm text-destructive">{createError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProject}
                      disabled={!projectName.trim() || isCreating}
                    >
                      {isCreating ? "Creating..." : "Create Project"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-4 text-destructive">
              <p className="text-sm font-medium">Error loading projects</p>
              <p className="text-sm">{error.message}</p>
            </div>
          )}
          <ProjectGrid projects={projects} isLoading={isLoading} />
        </div>
      </main>
    </div>
  )
}

export default App
