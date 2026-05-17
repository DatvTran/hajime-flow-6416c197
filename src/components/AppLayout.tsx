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
    <SidebarProvider style={sidebarLayoutVars} className="min-h-svh">
      <AppSidebar />
      <SidebarInset className="min-h-svh min-w-0 bg-background">
        <OperatorTopBar />
        <div className="scrollbar-thin relative flex-1 overflow-x-hidden overflow-y-auto bg-background px-4 pb-[max(3.75rem,env(safe-area-inset-bottom))] pt-7 sm:px-6 lg:px-9 lg:pb-[60px]">
          <Suspense fallback={<OperatorOutletFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
