import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InactivityWarningDialogProps {
  isOpen: boolean;
  timeRemaining: string;
  onStayActive: () => void;
}

export function InactivityWarningDialog({
  isOpen,
  timeRemaining,
  onStayActive,
}: InactivityWarningDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Are you still there?
          </DialogTitle>
          <DialogDescription>
            You have been inactive for 5 minutes. For security reasons, your session will be logged out soon.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="mt-4">
          <AlertDescription className="text-center font-mono text-lg">
            Auto-logout in: <strong>{timeRemaining}</strong>
          </AlertDescription>
        </Alert>

        <DialogFooter className="mt-6">
          <Button onClick={onStayActive} size="lg" className="w-full">
            I'm still here — Stay logged in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
