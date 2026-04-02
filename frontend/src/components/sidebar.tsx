import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Home,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react"

interface Project {
  id: string
  name: string
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean
  projects?: Project[]
}

interface NavItem {
  title: string
  icon: React.ReactNode
  isActive?: boolean
  items?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    title: "Home",
    icon: <Home className="h-4 w-4" />,
    isActive: true,
  },
  {
    title: "Search",
    icon: <Search className="h-4 w-4" />,
  },
  {
    title: "Settings",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    title: "Trash",
    icon: <Trash2 className="h-4 w-4" />,
  },
]

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, isCollapsed = false, projects = [], ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full flex-col border-r bg-background",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
        {...props}
      >
        {/* Workspace Header */}
        <div className="flex h-12 items-center border-b px-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary" />
            {!isCollapsed && (
              <span className="font-semibold">PromptOps</span>
            )}
          </div>
          {!isCollapsed && (
            <Button variant="ghost" size="icon" className="ml-auto h-6 w-6">
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <SidebarItem key={item.title} item={item} isCollapsed={isCollapsed} />
            ))}
          </div>

          {/* Pages Section */}
          {!isCollapsed && (
            <div className="mt-6">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Pages
                </span>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                <SidebarItem
                  item={{
                    title: "Getting Started",
                    icon: <FileText className="h-4 w-4" />,
                  }}
                  isCollapsed={isCollapsed}
                />
              </div>
            </div>
          )}

          {/* Projects Section */}
          {!isCollapsed && (
            <div className="mt-6">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Projects
                </span>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {projects.map((project) => (
                  <SidebarItem
                    key={project.id}
                    item={{
                      title: project.name,
                      icon: <Folder className="h-4 w-4" />,
                    }}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t p-2">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Plus className="h-4 w-4" />
              New Page
            </Button>
          </div>
        )}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

interface SidebarItemProps {
  item: NavItem
  isCollapsed?: boolean
}

function SidebarItem({ item, isCollapsed }: SidebarItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const hasItems = item.items && item.items.length > 0

  return (
    <div>
      <Button
        variant={item.isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-2",
          isCollapsed && "justify-center px-2"
        )}
        onClick={() => hasItems && setIsExpanded(!isExpanded)}
      >
        {item.icon}
        {!isCollapsed && <span>{item.title}</span>}
        {hasItems && !isCollapsed && (
          <ChevronRight
            className={cn(
              "ml-auto h-4 w-4 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        )}
      </Button>
      {hasItems && isExpanded && !isCollapsed && (
        <div className="ml-4 space-y-1">
          {item.items?.map((subItem) => (
            <SidebarItem key={subItem.title} item={subItem} isCollapsed={isCollapsed} />
          ))}
        </div>
      )}
    </div>
  )
}

export { Sidebar }
