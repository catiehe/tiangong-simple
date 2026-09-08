import { Link, useParams } from "react-router-dom"
import {
  Boxes,
  Component,
  Contact,
  Database,
  FileStack,
  LogOut,
  Ruler,
  User,
  Workflow,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { DATASET_TYPES, type DatasetType } from "@/lib/datasets"
import { supabase } from "@/lib/supabase"
import { useSessionStore } from "@/state/session"

const ICONS: Record<DatasetType, React.ComponentType<{ className?: string }>> = {
  model: Workflow,
  process: Component,
  flow: FileStack,
  flow_property: Ruler,
  unit_group: Boxes,
  source: Database,
  contact: Contact,
}

export function AppSidebar() {
  const { type: activeType } = useParams<{ type: string }>()
  const session = useSessionStore((s) => s.session)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Database className="size-5 shrink-0" />
          <span className="font-semibold group-data-[collapsible=icon]:hidden">
            PRISM LCA
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Open Data</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DATASET_TYPES.map(({ type, label }) => {
                const Icon = ICONS[type]
                return (
                  <SidebarMenuItem key={type}>
                    <SidebarMenuButton
                      asChild
                      tooltip={label}
                      isActive={activeType === type}
                    >
                      <Link to={`/open-data/${type}`}>
                        <Icon className="size-4" />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {session ? (
              <SidebarMenuButton
                tooltip={session.user.email}
                onClick={() => supabase?.auth.signOut()}
              >
                <LogOut className="size-4" />
                <span className="truncate">{session.user.email}</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild tooltip="Sign in">
                <Link to="/sign-in">
                  <User className="size-4" />
                  <span>Sign in</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
