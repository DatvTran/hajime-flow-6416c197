import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh min-w-0">
        <header className="glass-header sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] sm:px-6">
          <SidebarTrigger className="h-10 w-10 min-h-10 min-w-10 shrink-0 touch-manipulation rounded-lg transition-colors hover:bg-muted [&_svg]:size-5" />
          <span className="hajime-mark truncate text-sm font-medium tracking-wide text-foreground/80 lg:hidden">
            Hajime
          </span>
        </header>
        <div className="texture-noise scrollbar-thin relative flex-1 overflow-x-hidden overflow-y-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
