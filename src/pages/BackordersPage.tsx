import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { useAppData } from "@/contexts/AppDataContext";
import {
  AlertTriangle,
  Package,
  Truck,
  CheckCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  Search,
  Filter,
  Zap,
  BarChart3,
  TrendingUp,
  Boxes,
} from "lucide-react";
import type { BackorderLine } from "@/lib/backorder-service";
import {
  loadBackorders,
  saveBackorders,
  autoCreateBackorders,
  shipAvailableQuantity,
  releaseInventoryToBackorder,
  calculateBackorderSummary,
  getFulfillmentPriorityQueue,
  calculateAvailableBySku,
} from "@/lib/backorder-service";

const priorityColors = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  picking: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function BackordersPage() {
  const { data } = useAppData();
  const [backorders, setBackorders] = useState<BackorderLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [selectedBackorder, setSelectedBackorder] = useState<BackorderLine | null>(null);
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [shipQuantity, setShipQuantity] = useState(0);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [lastAutoRun, setLastAutoRun] = useState<string | null>(null);

  // Load backorders on mount
  useEffect(() => {
    const saved = loadBackorders();
    setBackorders(saved);
    setIsLoading(false);
  }, []);

  // Save backorders when changed
  useEffect(() => {
    if (!isLoading) {
      saveBackorders(backorders);
    }
  }, [backorders, isLoading]);

  // Auto-create backorders from inventory shortfalls
  const runAutoCreate = () => {
    const inventory = data.inventory.map((i) => ({
      sku: i.sku,
      quantityBottles: i.quantityBottles,
      status: i.status,
      productName: i.productName,
    }));

    const { newBackorders, updatedExisting } = autoCreateBackorders(
      data.salesOrders,
      inventory,
      backorders
    );

    if (newBackorders.length > 0 || updatedExisting.length > 0) {
      const existingMap = new Map(backorders.map((bo) => [bo.id, bo]));
      
      // Update existing
      for (const updated of updatedExisting) {
        existingMap.set(updated.id, updated);
      }
      
      // Add new
      for (const newBo of newBackorders) {
        existingMap.set(newBo.id, newBo);
      }

      setBackorders(Array.from(existingMap.values()));
      toast.success("Backorders updated", {
        description: `${newBackorders.length} new, ${updatedExisting.length} updated`,
      });
    } else {
      toast.info("No new backorders", {
        description: "All orders are covered by available inventory",
      });
    }
    
    setLastAutoRun(new Date().toLocaleTimeString());
  };

  // Run auto-create on mount if no backorders exist
  useEffect(() => {
    if (!isLoading && backorders.length === 0) {
      runAutoCreate();
    }
  }, [isLoading]);

  // Calculate summary stats
  const summary = useMemo(() => calculateBackorderSummary(backorders), [backorders]);

  // Calculate available inventory
  const availableBySku = useMemo(() => {
    return calculateAvailableBySku(data.inventory);
  }, [data.inventory]);

  // Get priority queue
  const priorityQueue = useMemo(() => {
    return getFulfillmentPriorityQueue(backorders);
  }, [backorders]);

  // Filter backorders
  const filteredBackorders = useMemo(() => {
    return backorders.filter((bo) => {
      const matchesSearch = 
        bo.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bo.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bo.salesOrderId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === "all" || bo.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || bo.status === statusFilter;
      
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [backorders, searchQuery, priorityFilter, statusFilter]);

  // Handle ship action
  const handleShip = () => {
    if (!selectedBackorder || shipQuantity <= 0) return;

    const updated = shipAvailableQuantity(
      selectedBackorder,
      shipQuantity,
      trackingNumber || undefined
    );

    setBackorders((prev) =>
      prev.map((bo) => (bo.id === updated.id ? updated : bo))
    );

    toast.success("Shipment created", {
      description: `${shipQuantity} bottles shipped from ${selectedBackorder.sku}`,
    });

    setShipDialogOpen(false);
    setSelectedBackorder(null);
    setShipQuantity(0);
    setTrackingNumber("");
  };

  // Handle release inventory
  const handleReleaseInventory = (backorder: BackorderLine) => {
    const available = availableBySku[backorder.sku] ?? 0;
    const toRelease = Math.min(available, backorder.backorderQuantity);
    
    if (toRelease <= 0) {
      toast.error("No inventory available", {
        description: `${backorder.sku} has 0 available bottles`,
      });
      return;
    }

    const updated = releaseInventoryToBackorder(backorder, toRelease);
    setBackorders((prev) =>
      prev.map((bo) => (bo.id === updated.id ? updated : bo))
    );

    toast.success("Inventory released", {
      description: `${toRelease} bottles of ${backorder.sku} now available to ship`,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Backorders & Constraints"
          description="Automated backorder management with split-shipment logic"
        />
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backorders & Constraints"
        description="Automated backorder creation from inventory shortfalls with split-shipment support"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={runAutoCreate}>
              <Zap className="mr-2 h-4 w-4" />
              Auto-Detect Shortfalls
            </Button>
            <Button asChild>
              <Link to="/distributor/orders">View Orders</Link>
            </Button>
          </div>
        }
      />

      {lastAutoRun && (
        <p className="text-xs text-muted-foreground">
          Last auto-detect: {lastAutoRun}
        </p>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Backorders</p>
                <p className="text-2xl font-bold">{summary.totalLines}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bottles Backordered</p>
                <p className="text-2xl font-bold text-red-600">{summary.totalBottlesBackordered.toLocaleString()}</p>
              </div>
              <Boxes className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available to Ship</p>
                <p className="text-2xl font-bold text-green-600">{summary.totalBottlesAvailable.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Priority</p>
                <p className="text-2xl font-bold">{summary.byPriority.critical || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="backorders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backorders">
            <Boxes className="mr-2 h-4 w-4" />
            Backorders ({filteredBackorders.length})
          </TabsTrigger>
          <TabsTrigger value="priority">
            <BarChart3 className="mr-2 h-4 w-4" />
            Priority Queue ({priorityQueue.length})
          </TabsTrigger>
          <TabsTrigger value="by-sku">
            <Package className="mr-2 h-4 w-4" />
            By SKU
          </TabsTrigger>
        </TabsList>

        {/* Backorders List */}
        <TabsContent value="backorders" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by account, SKU, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="picking">Picking</option>
                <option value="shipped">Shipped</option>
              </select>
            </div>
          </div>

          {/* Backorder Cards */}
          <div className="grid gap-4">
            {filteredBackorders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium">No backorders found</p>
                  <p className="text-muted-foreground">
                    {searchQuery || priorityFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "All orders are covered by available inventory"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredBackorders.map((bo) => (
                <Card key={bo.id} className={bo.autoCreated ? "border-amber-200" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{bo.salesOrderId}</span>
                          <Badge variant="outline" className={priorityColors[bo.priority]}>
                            {bo.priority}
                          </Badge>
                          <Badge variant="outline" className={statusColors[bo.status]}>
                            {bo.status}
                          </Badge>
                          {bo.autoCreated && (
                            <Badge variant="outline">Auto</Badge>
                          )}
                        </div>
                        <p className="font-medium">{bo.account}</p>
                        <p className="text-sm text-muted-foreground">
                          {bo.productName || bo.sku} · Created {new Date(bo.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Backordered</p>
                        <p className="text-xl font-bold text-red-600">{bo.backorderQuantity}</p>
                      </div>
                    </div>

                    {/* Quantity Breakdown */}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Original Order</span>
                        <span>{bo.originalQuantity} bottles</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Already Shipped</span>
                        <span className="text-green-600">{bo.alreadyShipped} bottles</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Available to Ship</span>
                        <span className={bo.availableToShip > 0 ? "text-blue-600" : ""}>
                          {bo.availableToShip} bottles
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining Backorder</span>
                        <span className="font-medium">{bo.backorderQuantity} bottles</span>
                      </div>

                      <Progress 
                        value={(bo.alreadyShipped / bo.originalQuantity) * 100} 
                        className="h-2"
                      />
                      
                      <p className="text-xs text-muted-foreground text-center">
                        {Math.round((bo.alreadyShipped / bo.originalQuantity) * 100)}% fulfilled
                      </p>
                    </div>

                    {/* Shipment Splits */}
                    {bo.splits.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Shipment History
                        </p>
                        {bo.splits.map((split) => (
                          <div key={split.splitId} className="flex items-center gap-2 text-sm">
                            <Truck className="h-4 w-4 text-green-500" />
                            <span>{split.quantityShipped} bottles shipped</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">
                              {new Date(split.shippedAt).toLocaleDateString()}
                            </span>
                            {split.trackingNumber && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <span className="font-mono text-xs">{split.trackingNumber}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      {bo.availableToShip > 0 && bo.status !== "shipped" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedBackorder(bo);
                            setShipQuantity(bo.availableToShip);
                            setShipDialogOpen(true);
                          }}
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          Ship Available ({bo.availableToShip})
                        </Button>
                      )}
                      
                      {bo.backorderQuantity > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReleaseInventory(bo)}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Release Inventory
                        </Button>
                      )}
                      
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/distributor/orders`}>View Order</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Priority Queue */}
        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Fulfillment Priority Queue</CardTitle>
              <p className="text-sm text-muted-foreground">
                Suggested fulfillment order based on priority and age
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {priorityQueue.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending backorders</p>
                ) : (
                  priorityQueue.map((bo, index) => (
                    <div
                      key={bo.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{bo.account}</span>
                          <Badge variant="outline" className={priorityColors[bo.priority]}>
                            {bo.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {bo.sku} · {bo.backorderQuantity} bottles backordered
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm">{bo.availableToShip} available</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor((Date.now() - new Date(bo.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d old
                        </p>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By SKU */}
        <TabsContent value="by-sku" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Backorders by SKU</CardTitle>
              <p className="text-sm text-muted-foreground">
                Consolidated view of backorders and available inventory per SKU
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.bySku).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No backorder data by SKU</p>
                ) : (
                  Object.entries(summary.bySku).map(([sku, data]) => (
                    <div key={sku} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium font-mono">{sku}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.backordered} backordered · {data.available} available
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm">Net: {availableBySku[sku] ?? 0} in stock</p>
                        <Progress 
                          value={((availableBySku[sku] ?? 0) / ((availableBySku[sku] ?? 0) + data.backordered)) * 100}
                          className="w-32 h-2 mt-1"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ship Dialog */}
      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shipment</DialogTitle>
          </DialogHeader>
          
          {selectedBackorder && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Order</Label>
                <p className="text-sm">{selectedBackorder.salesOrderId} · {selectedBackorder.account}</p>
              </div>
              
              <div className="space-y-2">
                <Label>SKU</Label>
                <p className="text-sm font-mono">{selectedBackorder.sku}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Quantity to Ship (max: {selectedBackorder.availableToShip})</Label>
                <Input
                  type="number"
                  min={1}
                  max={selectedBackorder.availableToShip}
                  value={shipQuantity}
                  onChange={(e) => setShipQuantity(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tracking Number (optional)</Label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., 1Z999AA10123456784"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleShip} disabled={shipQuantity <= 0}>Create Shipment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
