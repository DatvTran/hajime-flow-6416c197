import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRetailCart } from "@/contexts/RetailCartContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HajimeLogo } from "@/components/HajimeLogo";
import { LogOut, ShoppingBag } from "lucide-react";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 touch-manipulation",
    isActive
      ? "bg-foreground text-background shadow-sm"
      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  );

export function RetailLayout() {
  const { signOut } = useAuth();
  const { totalCases } = useRetailCart();

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="glass-header sticky top-0 z-40 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link to="/" className="group flex items-center gap-2.5 no-underline">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/60 transition-transform duration-200 group-hover:scale-105">
              <HajimeLogo variant="light" className="h-8 w-8 object-contain" alt="" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-lg font-semibold tracking-tight text-foreground">Hajime</span>
              <span className="ml-2 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Wholesale</span>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-1.5" aria-label="Retail">
            <NavLink to="/retail/new-order" end className={navClass}>
              New order
            </NavLink>
            <NavLink to="/retail/orders" className={navClass}>
              My orders
            </NavLink>
            <NavLink to="/retail/account" end className={navClass}>
              Account
            </NavLink>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="touch-manipulation rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => signOut()}
            >
              <LogOut className="mr-1 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </nav>
        </div>

        {totalCases > 0 && (
          <div className="mx-auto mt-2.5 max-w-6xl md:hidden">
            <a
              href="#retail-cart"
              className="flex items-center justify-center gap-2 rounded-full bg-foreground/5 py-1.5 text-xs transition-colors hover:bg-foreground/10"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-accent" />
              <span className="text-muted-foreground">
                {totalCases} case{totalCases !== 1 ? "s" : ""} in cart
              </span>
              <span className="font-medium text-foreground">Review →</span>
            </a>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
