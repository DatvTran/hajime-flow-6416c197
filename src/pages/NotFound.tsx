import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Home, Compass, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Page not found"
        description="That path doesn't exist in the Hajime portal."
      />

      <div className="card-elevated flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-accent/10">
          <Compass className="h-12 w-12 text-accent/70" strokeWidth={1} />
        </div>

        <h2 className="font-display text-7xl font-semibold tracking-tight text-foreground">404</h2>
        <p className="mt-3 text-lg text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <p className="mt-2 text-sm text-muted-foreground/60 font-mono">
          {location.pathname}
        </p>

        <div className="mt-10 flex flex-col gap-2 sm:flex-row">
          <Button className="h-11 touch-manipulation" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Return home
            </Link>
          </Button>
          <Button variant="ghost" className="h-11 touch-manipulation" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
