import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh min-w-0">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-card/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6">
          <SidebarTrigger className="h-9 w-9 shrink-0 touch-manipulation" />
          <span className="truncate font-display text-sm font-semibold tracking-tight text-foreground md:hidden">
            Hajime
          </span>
        </header>
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
