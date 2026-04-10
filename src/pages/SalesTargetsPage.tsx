import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSalesOrders } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";
import { getSalesTargets } from "@/lib/api-v1-mutations";
import { toast } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Loader2,
  Award,
  BarChart3
} from "lucide-react";

interface SalesTarget {
  id: string;
  sales_rep: string;
  quarter: number;
  year: number;
  target_amount: number;
  achieved_amount: number;
}

export default function SalesTargetsPage() {
  const { user } = useAuth();
  const { salesOrders } = useSalesOrders();
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(getCurrentQuarter());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const repName = useMemo(() => {
    return resolveSalesRepLabelForSession(user?.email, user?.displayName);
  }, [user]);

  function getCurrentQuarter(): number {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  }

  const fetchTargets = async () => {
    setIsLoading(true);
    try {
      const response = await getSalesTargets({
        sales_rep: repName,
        quarter: selectedQuarter,
        year: selectedYear,
      });
      setTargets(response.data || []);
    } catch (err: any) {
      toast.error("Failed to load targets", { description: err.message });
      setTargets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [repName, selectedQuarter, selectedYear]);

  // Calculate actual performance from sales orders
  const performance = useMemo(() => {
    const quarterStart = new Date(selectedYear, (selectedQuarter - 1) * 3, 1);
    const quarterEnd = new Date(selectedYear, selectedQuarter * 3, 0);

    const repOrders = salesOrders.filter(o => 
      o.salesRep === repName &&
      o.status !== "cancelled" &&
      o.status !== "draft"
    );

    const quarterOrders = repOrders.filter(o => {
      const orderDate = new Date(o.orderDate);
      return orderDate >= quarterStart && orderDate <= quarterEnd;
    });

    const achieved = quarterOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
    
    // Also include orders outside quarter for YTD calculation
    const ytdStart = new Date(selectedYear, 0, 1);
    const ytdOrders = repOrders.filter(o => {
      const orderDate = new Date(o.orderDate);
      return orderDate >= ytdStart && orderDate <= quarterEnd;
    });
    const ytdAchieved = ytdOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0);

    return {
      quarterAchieved: achieved,
      quarterOrders: quarterOrders.length,
      ytdAchieved,
      ytdOrders: ytdOrders.length,
      avgOrderValue: quarterOrders.length > 0 ? achieved / quarterOrders.length : 0,
    };
  }, [salesOrders, repName, selectedQuarter, selectedYear]);

  const currentTarget = useMemo(() => {
    return targets.find(t => 
      t.sales_rep === repName && 
      t.quarter === selectedQuarter && 
      t.year === selectedYear
    );
  }, [targets, repName, selectedQuarter, selectedYear]);

  const targetAmount = currentTarget?.target_amount || 0;
  const achievedAmount = performance.quarterAchieved;
  const progress = targetAmount > 0 ? Math.min((achievedAmount / targetAmount) * 100, 100) : 0;
  const remaining = Math.max(targetAmount - achievedAmount, 0);

  // Monthly breakdown for the quarter
  const monthlyBreakdown = useMemo(() => {
    const months = [];
    for (let i = 0; i < 3; i++) {
      const monthIndex = (selectedQuarter - 1) * 3 + i;
      const monthStart = new Date(selectedYear, monthIndex, 1);
      const monthEnd = new Date(selectedYear, monthIndex + 1, 0);
      
      const monthOrders = salesOrders.filter(o => {
        if (o.salesRep !== repName || o.status === "cancelled" || o.status === "draft") return false;
        const orderDate = new Date(o.orderDate);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
      
      months.push({
        name: monthStart.toLocaleString("default", { month: "short" }),
        revenue: monthRevenue,
        orders: monthOrders.length,
      });
    }
    return months;
  }, [salesOrders, repName, selectedQuarter, selectedYear]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Targets"
        description="Track your quarterly goals vs actual sell-in performance."
      />

      {/* Quarter/Year Selector */}
      <div className="flex gap-4">
        <div className="w-40">
          <Select 
            value={String(selectedQuarter)} 
            onValueChange={(v) => setSelectedQuarter(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((q) => (
                <SelectItem key={q} value={String(q)}>Q{q} {selectedYear}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-32">
          <Select 
            value={String(selectedYear)} 
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Main Target Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Q{selectedQuarter} {selectedYear} Target
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {targetAmount > 0 ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    
                    <div className="flex justify-between text-sm">
                      <span>${achievedAmount.toLocaleString()} achieved</span>
                      <span className="text-muted-foreground">
                        ${targetAmount.toLocaleString()} target
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          {achievedAmount >= targetAmount ? (
                            <Award className="h-8 w-8 text-green-500" />
                          ) : (
                            <TrendingUp className="h-8 w-8 text-blue-500" />
                          )}
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="text-lg font-semibold">
                              {achievedAmount >= targetAmount ? "Target Met! 🎉" : "In Progress"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-8 w-8 text-amber-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Remaining</p>
                            <p className="text-lg font-semibold">
                              ${remaining.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-8 w-8 text-purple-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Orders</p>
                            <p className="text-lg font-semibold">
                              {performance.quarterOrders}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No target set</p>
                  <p className="text-muted-foreground">
                    Contact your manager to set a Q{selectedQuarter} {selectedYear} target.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {monthlyBreakdown.map((month) => (
                  <div key={month.name} className="space-y-2">
                    <p className="font-medium">{month.name}</p>
                    <p className="text-2xl font-bold">${month.revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {month.orders} orders
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quarter Revenue</p>
                  <p className="text-2xl font-bold">${performance.quarterAchieved.toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">YTD Revenue</p>
                  <p className="text-2xl font-bold">${performance.ytdAchieved.toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold">${performance.avgOrderValue.toFixed(0)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">YTD Orders</p>
                  <p className="text-2xl font-bold">{performance.ytdOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
