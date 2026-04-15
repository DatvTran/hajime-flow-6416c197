import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Building2,
  MapPin,
  ArrowRight,
  Package,
  Plus,
  Trash2,
  Search,
  Check,
  ChevronDown,
  Warehouse,
  Store,
  Truck,
  Globe,
  FileText,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Order routing pathways
type OrderPathway = "direct_to_retail" | "via_distributor" | "via_manufacturer";

interface OrderLine {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface AccountOption {
  id: string;
  name: string;
  tradingName?: string;
  type: "distributor" | "retail" | "manufacturer";
  market: string;
  region?: string;
}

export default function NewWholesaleOrderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accounts, products, inventory, addSalesOrder } = useAppData();
  const { toast } = useToast();

  // Form state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Order pathway and routing
  const [orderPathway, setOrderPathway] = useState<OrderPathway>("via_distributor");
  const [distributorId, setDistributorId] = useState<string>("");
  
  // Step 2: Customer selection
  const [customerId, setCustomerId] = useState<string>("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [market, setMarket] = useState<string>("");
  
  // Step 3: Order details
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [notes, setNotes] = useState("");
  const [initialStatus, setInitialStatus] = useState<"draft" | "pending_review">("draft");

  // Derived data
  const wholesaleAccounts = useMemo(() => {
    return (accounts || [])
      .filter(a => a.deletedAt === null)
      .map(a => ({
        id: a.id,
        name: a.name,
        tradingName: a.tradingName,
        type: a.type as "distributor" | "retail" | "manufacturer",
        market: a.market || "Unknown",
        region: a.region || a.market || "Unknown",
      }));
  }, [accounts]);

  const distributors = useMemo(() => {
    return wholesaleAccounts.filter(a => a.type === "distributor");
  }, [wholesaleAccounts]);

  const retailAccounts = useMemo(() => {
    return wholesaleAccounts.filter(a => a.type === "retail");
  }, [wholesaleAccounts]);

  const selectedCustomer = wholesaleAccounts.find(a => a.id === customerId);
  const selectedDistributor = wholesaleAccounts.find(a => a.id === distributorId);

  const availableProducts = useMemo(() => {
    return (products || [])
      .filter(p => p.deletedAt === null)
      .map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unitSize: p.unitSize || "750ml",
        wholesalePrice: p.metadata?.wholesalePrice || 24.99,
        availableQty: inventory?.filter(i => i.productId === p.id && i.locationType === "distributor_warehouse")
          .reduce((sum, i) => sum + (i.availableQuantity || 0), 0) || 0,
      }));
  }, [products, inventory]);

  const orderTotals = useMemo(() => {
    const subtotal = orderLines.reduce((sum, line) => sum + line.total, 0);
    const taxRate = 0.13; // 13% tax
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    const totalBottles = orderLines.reduce((sum, line) => sum + line.quantity, 0);
    return { subtotal, taxAmount, total, totalBottles };
  }, [orderLines]);

  // Add order line
  const addOrderLine = () => {
    const newLine: OrderLine = {
      id: crypto.randomUUID(),
      productId: "",
      sku: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setOrderLines([...orderLines, newLine]);
  };

  // Update order line
  const updateOrderLine = (lineId: string, updates: Partial<OrderLine>) => {
    setOrderLines(lines => lines.map(line => {
      if (line.id !== lineId) return line;
      
      const updated = { ...line, ...updates };
      
      // If product changed, update price and name
      if (updates.productId) {
        const product = availableProducts.find(p => p.id === updates.productId);
        if (product) {
          updated.sku = product.sku;
          updated.productName = product.name;
          updated.unitPrice = product.wholesalePrice;
        }
      }
      
      // Recalculate total
      updated.total = updated.quantity * updated.unitPrice;
      
      return updated;
    }));
  };

  // Remove order line
  const removeOrderLine = (lineId: string) => {
    setOrderLines(lines => lines.filter(l => l.id !== lineId));
  };

  // Submit order
  const handleSubmit = async () => {
    if (!customerId) {
      toast({ title: "Error", description: "Please select a customer account", variant: "destructive" });
      return;
    }
    
    if (orderLines.length === 0 || !orderLines.some(l => l.productId)) {
      toast({ title: "Error", description: "Please add at least one product", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const order = {
        orderNumber: `SO-${Date.now().toString(36).toUpperCase()}`,
        accountId: customerId,
        status: initialStatus,
        orderDate: new Date(),
        salesRep: user?.id,
        subtotal: orderTotals.subtotal,
        taxAmount: orderTotals.taxAmount,
        totalAmount: orderTotals.total,
        notes,
        items: orderLines
          .filter(l => l.productId)
          .map(l => ({
            productId: l.productId,
            sku: l.sku,
            productName: l.productName,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        routing: {
          pathway: orderPathway,
          distributorId: orderPathway === "via_distributor" ? distributorId : undefined,
        },
      };

      await addSalesOrder(order);
      
      toast({
        title: "Order Created",
        description: `Order ${order.orderNumber} created successfully as ${initialStatus}`,
      });
      
      navigate("/orders");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render steps
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base">Order Pathway</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              orderPathway === "direct_to_retail" && "border-primary bg-primary/5"
            )}
            onClick={() => setOrderPathway("direct_to_retail")}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <span className="font-semibold">Direct to Retail</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ship directly to retail account from Hajime HQ
              </p>
              <Badge variant="outline">Fastest delivery</Badge>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              orderPathway === "via_distributor" && "border-primary bg-primary/5"
            )}
            onClick={() => setOrderPathway("via_distributor")}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-primary" />
                <span className="font-semibold">Via Distributor</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Route through distributor warehouse for fulfillment
              </p>
              <Badge variant="outline">Most common</Badge>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              orderPathway === "via_manufacturer" && "border-primary bg-primary/5"
            )}
            onClick={() => setOrderPathway("via_manufacturer")}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <span className="font-semibold">Via Manufacturer</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Direct from manufacturer to customer
              </p>
              <Badge variant="outline">Bulk orders</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {orderPathway === "via_distributor" && (
        <div className="space-y-2">
          <Label>Select Distributor / DC</Label>
          <Select value={distributorId} onValueChange={setDistributorId}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Choose distributor warehouse..." />
            </SelectTrigger>
            <SelectContent>
              {distributors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  <div className="flex flex-col">
                    <span>{d.tradingName || d.name}</span>
                    <span className="text-xs text-muted-foreground">{d.market}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedDistributor && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{selectedDistributor.market} Region</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={() => setStep(2)} size="lg">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base">Select Customer Account</Label>
        
        <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={customerSearchOpen}
              className="w-full md:w-[500px] justify-between"
            >
              {selectedCustomer ? (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCustomer.tradingName || selectedCustomer.name}</span>
                  <Badge variant="secondary" className="ml-2">{selectedCustomer.type}</Badge>
                </div>
              ) : (
                "Search accounts..."
              )}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-0">
            <Command>
              <CommandInput placeholder="Search by name, market, or type..." />
              <CommandList>
                <CommandEmpty>No accounts found.</CommandEmpty>
                <CommandGroup heading="Distributors">
                  {wholesaleAccounts
                    .filter(a => a.type === "distributor")
                    .map((account) => (
                      <CommandItem
                        key={account.id}
                        value={account.id}
                        onSelect={() => {
                          setCustomerId(account.id);
                          setMarket(account.market);
                          setCustomerSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            customerId === account.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{account.tradingName || account.name}</span>
                          <span className="text-xs text-muted-foreground">{account.market}</span>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
                <CommandGroup heading="Retail">
                  {wholesaleAccounts
                    .filter(a => a.type === "retail")
                    .map((account) => (
                      <CommandItem
                        key={account.id}
                        value={account.id}
                        onSelect={() => {
                          setCustomerId(account.id);
                          setMarket(account.market);
                          setCustomerSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            customerId === account.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{account.tradingName || account.name}</span>
                          <span className="text-xs text-muted-foreground">{account.market}</span>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedCustomer && (
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-semibold">{selectedCustomer.name}</span>
              </div>
              <Badge>{selectedCustomer.type}</Badge>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Market:</span>
                <p className="font-medium">{selectedCustomer.market}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Region:</span>
                <p className="font-medium">{selectedCustomer.region}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label>Market / Region</Label>
        <Input 
          value={market} 
          onChange={(e) => setMarket(e.target.value)}
          placeholder="e.g., Ontario, Toronto, Milan"
          className="w-full md:w-[400px]"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => setStep(3)} size="lg" disabled={!customerId}>
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Order Items</Label>
          <Button onClick={addOrderLine} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>

        <div className="space-y-3">
          {orderLines.map((line, index) => (
            <Card key={line.id} className="relative">
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <Label className="text-xs mb-1">Product</Label>
                    <Select
                      value={line.productId}
                      onValueChange={(value) => updateOrderLine(line.id, { productId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex flex-col">
                              <span>{p.name} ({p.sku})</span>
                              <span className="text-xs text-muted-foreground">
                                ${p.wholesalePrice.toFixed(2)} | {p.availableQty} available
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs mb-1">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateOrderLine(line.id, { quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs mb-1">Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.unitPrice.toFixed(2)}
                      onChange={(e) => updateOrderLine(line.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs mb-1">Total</Label>
                    <div className="h-10 flex items-center font-medium">
                      ${line.total.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeOrderLine(line.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {orderLines.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2" />
              <p>No products added yet</p>
              <Button onClick={addOrderLine} variant="link" size="sm">
                Add your first product
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Order Status</Label>
            <Select value={initialStatus} onValueChange={(v) => setInitialStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft - Save for later</SelectItem>
                <SelectItem value="pending_review">Pending Review - Requires approval</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {initialStatus === "draft" 
                ? "Order will be saved as draft and won't be processed until submitted"
                : "Order will be submitted for approval by operations team"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions, delivery notes, or internal comments..."
              rows={4}
            />
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${orderTotals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (13%)</span>
              <span>${orderTotals.taxAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${orderTotals.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total Bottles</span>
              <span>{orderTotals.totalBottles}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(2)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          size="lg" 
          disabled={isSubmitting || orderLines.length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Order...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Create Order
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/orders">Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Wholesale Order</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">New Wholesale Order</h1>
        <p className="text-muted-foreground">
          Create a sell-in on behalf of Hajime HQ — full CRM, allocation, and lifecycle management
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-4">
        <div className={cn("flex items-center gap-2", step >= 1 && "text-primary")}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-medium",
            step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            1
          </div>
          <span className="hidden md:inline">Pathway</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={cn("flex items-center gap-2", step >= 2 && "text-primary")}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-medium",
            step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            2
          </div>
          <span className="hidden md:inline">Customer</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={cn("flex items-center gap-2", step >= 3 && "text-primary")}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-medium",
            step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            3
          </div>
          <span className="hidden md:inline">Details</span>
        </div>
      </div>

      {/* Content */}
      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle>
            {step === 1 && "Select Order Pathway"}
            {step === 2 && "Select Customer Account"}
            {step === 3 && "Order Details & Items"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Choose how this order will flow through the supply chain"}
            {step === 2 && "Search and select the customer account for this sell-in"}
            {step === 3 && "Add products, quantities, and set order status"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>Routing: <strong>{orderPathway.replace(/_/g, " ")}</strong></span>
            </div>
            {selectedDistributor && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <span>DC: <strong>{selectedDistributor.tradingName}</strong></span>
                </div>
              </>
            )}
            {selectedCustomer && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Customer: <strong>{selectedCustomer.tradingName || selectedCustomer.name}</strong></span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Market: <strong>{market}</strong></span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
