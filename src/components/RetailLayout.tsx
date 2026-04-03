import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRetailCart } from "@/contexts/RetailCartContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-full px-3 py-2 text-sm font-medium transition-colors touch-manipulation",
    isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export function RetailLayout() {
  const { signOut } = useAuth();
  const { totalCases } = useRetailCart();

  return (
    <div className="flex min-h-svh flex-col bg-[#faf9f7] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-[#faf9f7]/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-[#faf9f7]/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white">H</div>
            <span className="font-display text-lg font-semibold tracking-tight">Hajime</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2" aria-label="Retail">
            <NavLink to="/retail/new-order" end className={navClass}>
              New order
            </NavLink>
            <NavLink to="/retail/orders" className={navClass}>
              My orders
            </NavLink>
            <NavLink to="/retail/account" end className={navClass}>
              Account
            </NavLink>
            <Button type="button" variant="ghost" size="sm" className="touch-manipulation rounded-full" onClick={() => signOut()}>
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </nav>
        </div>
        {totalCases > 0 ? (
          <p className="mx-auto mt-2 max-w-6xl text-center text-xs text-muted-foreground md:hidden">
            {totalCases} case{totalCases !== 1 ? "s" : ""} in cart —{" "}
            <a href="#retail-cart" className="font-medium text-foreground underline-offset-2 hover:underline">
              open cart
            </a>
          </p>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
