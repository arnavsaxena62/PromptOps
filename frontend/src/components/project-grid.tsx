import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Folder, MoreHorizontal, Play, FileText, Cog, TestTube } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Project {
  id: string
  name: string
  prompt_version_count: number
  model_config_count: number
  test_case_count: number
  run_count: number
}

interface ProjectGridProps extends React.HTMLAttributes<HTMLDivElement> {
  projects?: Project[]
  isLoading?: boolean
}

const ProjectGrid = React.forwardRef<HTMLDivElement, ProjectGridProps>(
  ({ className, projects = [], isLoading = false, ...props }, ref) => {
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
          {...props}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-3 w-full rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (projects.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center py-12",
            className
          )}
          {...props}
        >
          <Folder className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first project to get started
          </p>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
        {...props}
      >
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    )
  }
)
ProjectGrid.displayName = "ProjectGrid"

interface ProjectCardProps {
  project: Project
}

function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">{project.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{project.prompt_version_count} prompts</span>
          </div>
          <div className="flex items-center gap-1">
            <Cog className="h-3 w-3" />
            <span>{project.model_config_count} models</span>
          </div>
          <div className="flex items-center gap-1">
            <TestTube className="h-3 w-3" />
            <span>{project.test_case_count} tests</span>
          </div>
          <div className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            <span>{project.run_count} runs</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { ProjectGrid }
