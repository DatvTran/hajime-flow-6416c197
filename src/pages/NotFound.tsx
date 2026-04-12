import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
      />

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>

          <h1 className="font-display text-6xl font-semibold tracking-tight">404</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Oops! Page not found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Path: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{location.pathname}</code>
          </p>

          <Button className="mt-8" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
