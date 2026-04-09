import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload } from "lucide-react";
import { CSVImportDialog } from "./CSVImportDialog";

type ImportType = "inventory" | "products" | "accounts";

interface CSVImportButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  defaultType?: ImportType;
  onSuccess?: () => void;
}

export function CSVImportButton({
  variant = "outline",
  size = "sm",
  className,
  defaultType = "inventory",
  onSuccess,
}: CSVImportButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importType, setImportType] = useState<ImportType>(defaultType);

  const openImport = (type: ImportType) => {
    setImportType(type);
    setDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Import Data</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openImport("inventory")}>
            Inventory Levels
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openImport("products")}>
            Products
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openImport("accounts")}>
            Accounts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CSVImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        importType={importType}
        onSuccess={onSuccess}
      />
    </>
  );
}
