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
import { toast } from "@/components/ui/sonner";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

interface CSVExportButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function CSVExportInventoryButton({ variant = "outline", size = "sm", className }: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (filters?: { lowStock?: boolean; location?: string }) => {
    setIsExporting(true);

    try {
      const token = localStorage.getItem("hajime_access_token");
      const params = new URLSearchParams();
      if (filters?.lowStock) params.set("lowStock", "true");
      if (filters?.location) params.set("location", filters.location);

      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(`${API_URL}/api/csv/export/inventory?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Inventory exported", {
        description: "Your CSV file has been downloaded",
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.error("Export timeout", { description: "The export took too long. Please try with filters or contact support." });
      } else {
        toast.error("Export failed", { description: err.message });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport()}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          All Inventory
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport({ lowStock: true })}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-amber-500" />
          Low Stock Only
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CSVExportOrdersButton({ variant = "outline", size = "sm", className }: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (filters?: { status?: string; dateFrom?: string; dateTo?: string }) => {
    setIsExporting(true);

    try {
      const token = localStorage.getItem("hajime_access_token");
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);

      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(`${API_URL}/api/csv/export/orders?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Orders exported", {
        description: "Your CSV file has been downloaded",
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.error("Export timeout", { description: "The export took too long. Please try with filters or contact support." });
      } else {
        toast.error("Export failed", { description: err.message });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport()}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          All Orders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport({ status: "pending" })}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-amber-500" />
          Pending Orders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport({ status: "confirmed" })}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
          Confirmed Orders
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CSVExportSalesReportButton({
  variant = "outline",
  size = "sm",
  className,
  dateFrom,
  dateTo,
}: CSVExportButtonProps & { dateFrom?: string; dateTo?: string }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const token = localStorage.getItem("hajime_access_token");
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(`${API_URL}/api/csv/export/sales-by-account?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fromStr = dateFrom || "start";
      const toStr = dateTo || "end";
      a.download = `sales-by-account-${fromStr}-to-${toStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Sales report exported", {
        description: "Your CSV file has been downloaded",
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.error("Export timeout", { description: "The export took too long. Please try with a shorter date range or contact support." });
      } else {
        toast.error("Export failed", { description: err.message });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleExport} disabled={isExporting}>
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Export CSV
    </Button>
  );
}
