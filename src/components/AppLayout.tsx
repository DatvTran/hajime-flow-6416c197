import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import type { CSSProperties } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { OperatorTopBar } from "@/components/OperatorTopBar";
import { OperatorOutletFallback } from "@/components/OperatorOutletFallback";

const sidebarLayoutVars = { "--sidebar-width": "240px" } as CSSProperties;

export function AppLayout() {
  return (
    <SidebarProvider style={sidebarLayoutVars} className="h-svh max-h-svh min-h-0 overflow-hidden overscroll-none">
      <AppSidebar />
      <SidebarInset className="flex h-full max-h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background">
        <OperatorTopBar />
        <div className="scrollbar-thin relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain touch-pan-y bg-background px-4 pb-[max(3.75rem,env(safe-area-inset-bottom))] pt-7 sm:px-6 lg:px-9 lg:pb-[60px]">
          <Suspense fallback={<OperatorOutletFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
