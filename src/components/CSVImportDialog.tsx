import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/sonner";
import { Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

interface CSVPreview {
  headers: string[];
  sampleRows: Record<string, string>[];
  rowCount: number;
}

interface ValidationResult {
  valid: number;
  invalid: number;
  errors: { row: number; errors: { field: string; message: string }[]; original: Record<string, string> }[];
}

interface ImportPreview {
  preview: CSVPreview;
  validation: ValidationResult;
  tempImportId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allRows: any[];
}

type ImportType = "inventory" | "products" | "accounts";

const IMPORT_TEMPLATES: Record<ImportType, { label: string; description: string; fields: string[] }> = {
  inventory: {
    label: "Inventory",
    description: "Update stock levels by SKU and location",
    fields: ["sku", "quantity", "location", "reorderPoint"],
  },
  products: {
    label: "Products",
    description: "Create or update product catalog",
    fields: ["sku", "name", "description", "category", "unitSize"],
  },
  accounts: {
    label: "Accounts",
    description: "Create or update customer accounts",
    fields: ["accountNumber", "name", "type", "market", "email", "phone"],
  },
};

export function CSVImportDialog({
  open,
  onOpenChange,
  importType,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importType: ImportType;
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("hajime_access_token");
      
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch(`${API_URL}/api/csv/import/preview/${importType}`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Failed to upload file");
      }

      const data: ImportPreview = await response.json();
      setPreview(data);
      setStep("preview");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.error("Upload timeout", { description: "The upload took too long. Please try a smaller file or check your connection." });
      } else {
        toast.error("Upload failed", { description: err.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setStep("importing");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("hajime_access_token");
      
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout for commit
      
      const response = await fetch(`${API_URL}/api/csv/import/commit/${importType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          allRows: preview.allRows,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Import failed" }));
        throw new Error(error.error || "Failed to import");
      }

      const result = await response.json();
      setImportResult(result);
      setStep("complete");
      onSuccess?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.error("Import timeout", { description: "The import took too long. Please try with fewer rows or contact support." });
      } else {
        toast.error("Import failed", { description: err.message });
      }
      setStep("preview");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = IMPORT_TEMPLATES[importType];
    const csvContent = template.fields.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${importType}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const reset = () => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {IMPORT_TEMPLATES[importType].label}</DialogTitle>
          <DialogDescription>{IMPORT_TEMPLATES[importType].description}</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {file ? file.name : "Click to select CSV file or drag and drop"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
              <Button onClick={handleUpload} disabled={!file || isLoading}>
                {isLoading ? "Uploading..." : "Preview Import"}
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && preview && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>{preview.validation.valid} valid rows</span>
              </div>
              {preview.validation.invalid > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{preview.validation.invalid} invalid rows</span>
                </div>
              )}
              <div className="text-muted-foreground">Total: {preview.preview.rowCount} rows</div>
            </div>

            {preview.validation.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors</h4>
                <ul className="space-y-2 text-sm">
                  {preview.validation.errors.slice(0, 10).map((error, idx) => (
                    <li key={idx} className="text-red-700">
                      Row {error.row}: {error.errors.map((e) => `${e.field}: ${e.message}`).join(", ")}
                    </li>
                  ))}
                  {preview.validation.errors.length > 10 && (
                    <li className="text-red-600 italic">
                      ...and {preview.validation.errors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {preview.preview.headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.sampleRows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      {preview.preview.headers.map((h) => (
                        <td key={h} className="px-3 py-2 truncate max-w-[150px]">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={preview.validation.valid === 0 || isLoading}
              >
                {isLoading ? "Importing..." : `Import ${preview.validation.valid} Rows`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 text-center space-y-4">
            <Progress value={50} className="w-full" />
            <p className="text-muted-foreground">Importing data...</p>
          </div>
        )}

        {step === "complete" && importResult && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <p className="text-lg font-medium">Import Complete</p>
              <p className="text-muted-foreground">
                {importResult.imported} rows imported successfully
                {importResult.failed > 0 && `, ${importResult.failed} failed`}
              </p>
            </div>
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
