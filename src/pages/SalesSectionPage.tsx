import { useState, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  Target,
  AlertTriangle,
  TrendingDown,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Users,
  ShoppingCart,
  Phone,
  MapPin,
  Star,
  Filter,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { toast } from "@/components/ui/sonner";
import type { Account, SalesRepNote } from "@/data/accounts";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";

interface Opportunity {
  id: string;
  accountId: string;
  account: Account;
  type: "prospect" | "reorder" | "dormant" | "velocity-drop";
  score: number;
  reason: string;
  suggestedAction: string;
  daysSinceLastOrder?: number;
  avgOrderValue?: number;
  lastOrderDate?: string;
}

interface Task {
  id: string;
  accountId: string;
  accountName: string;
  type: "call" | "visit" | "email" | "demo" | "follow-up";
  priority: "low" | "medium" | "high";
  dueDate: string;
  notes: string;
  completed: boolean;
  createdAt: string;
}

const TYPE_LABELS: Record<Opportunity["type"], { label: string; icon: React.ReactNode; color: string }> = {
  prospect: { label: "New Prospect", icon: <Target className="h-4 w-4" />, color: "bg-blue-100 text-blue-700" },
  reorder: { label: "Needs Reorder", icon: <ShoppingCart className="h-4 w-4" />, color: "bg-amber-100 text-amber-700" },
  dormant: { label: "Dormant Account", icon: <AlertTriangle className="h-4 w-4" />, color: "bg-red-100 text-red-700" },
  "velocity-drop": { label: "Velocity Drop", icon: <TrendingDown className="h-4 w-4" />, color: "bg-orange-100 text-orange-700" },
};

const TASK_TYPE_LABELS: Record<Task["type"], string> = {
  call: "Phone Call",
  visit: "Field Visit",
  email: "Email",
  demo: "Product Demo",
  "follow-up": "Follow-up",
};

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  low: "text-slate-600",
  medium: "text-blue-600",
  high: "text-red-600",
};

export default function SalesSectionPage() {
  const { section } = useParams<{ section: string }>();
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<Opportunity["type"] | "all">("all");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    type: "call",
    priority: "medium",
    dueDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const rep = useMemo(
    () => resolveSalesRepLabelForSession(user?.email, user?.displayName ?? ""),
    [user?.email, user?.displayName]
  );

  const myAccounts = useMemo(
    () => data.accounts.filter((a) => a.salesOwner === rep),
    [data.accounts, rep]
  );

  if (!section || !["opportunities", "visits"].includes(section)) {
    return <Navigate to="/" replace />;
  }

  const isOpportunities = section === "opportunities";

  // Get tasks from AppData
  const tasks: Task[] = data.salesTasks || [];
  const myTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  // Generate opportunities from account data
  const opportunities: Opportunity[] = useMemo(() => {
    const ops: Opportunity[] = [];
    const now = Date.now();
    const MS_DAY = 86400000;

    myAccounts.forEach((account) => {
      const lastOrder = account.lastOrderDate ? Date.parse(account.lastOrderDate) : 0;
      const daysSince = lastOrder ? Math.floor((now - lastOrder) / MS_DAY) : null;

      // Dormant: 60+ days no order
      if (daysSince && daysSince > 60) {
        ops.push({
          id: `dormant-${account.id}`,
          accountId: account.id,
          account,
          type: "dormant",
          score: Math.min(daysSince / 2, 100),
          reason: `No orders for ${daysSince} days`,
          suggestedAction: "Reach out with special offer or check competition",
          daysSinceLastOrder: daysSince,
          avgOrderValue: account.averageOrderValue,
          lastOrderDate: account.lastOrderDate,
        });
      }
      // Needs reorder: 30-60 days
      else if (daysSince && daysSince > 30) {
        ops.push({
          id: `reorder-${account.id}`,
          accountId: account.id,
          account,
          type: "reorder",
          score: 70 + daysSince,
          reason: `Likely needs restock (${daysSince} days since last order)`,
          suggestedAction: "Call to confirm stock levels and schedule delivery",
          daysSinceLastOrder: daysSince,
          avgOrderValue: account.averageOrderValue,
          lastOrderDate: account.lastOrderDate,
        });
      }
      // Prospect: no orders yet
      else if (!lastOrder && account.status === "active") {
        ops.push({
          id: `prospect-${account.id}`,
          accountId: account.id,
          account,
          type: "prospect",
          score: 50,
          reason: "New account - needs placement",
          suggestedAction: "Schedule initial visit and tasting",
        });
      }
    });

    // Sort by score (highest first)
    return ops.sort((a, b) => b.score - a.score);
  }, [myAccounts]);

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((op) => {
    const matchesSearch =
      op.account.tradingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.account.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || op.type === filterType;
    return matchesSearch && matchesType;
  });

  // Get visit notes
  const visitNotes: SalesRepNote[] = data.visitNotes || [];
  const myVisitNotes = visitNotes.filter((n) => n.authorRep === user.email);

  const handleCreateTask = () => {
    if (!selectedOpportunity || !newTask.type || !newTask.dueDate) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      accountId: selectedOpportunity.accountId,
      accountName: selectedOpportunity.account.tradingName,
      type: newTask.type as Task["type"],
      priority: (newTask.priority as Task["priority"]) || "medium",
      dueDate: newTask.dueDate,
      notes: newTask.notes || "",
      completed: false,
      createdAt: new Date().toISOString(),
    };

    updateData((d) => ({
      ...d,
      salesTasks: [task, ...(d.salesTasks || [])],
    }));

    toast.success("Task created", { description: `Scheduled ${TASK_TYPE_LABELS[task.type]} for ${task.accountName}` });
    setShowTaskModal(false);
    setSelectedOpportunity(null);
    setNewTask({ type: "call", priority: "medium", dueDate: new Date().toISOString().split("T")[0], notes: "" });
  };

  const completeTask = (taskId: string) => {
    updateData((d) => ({
      ...d,
      salesTasks: d.salesTasks?.map((t) => (t.id === taskId ? { ...t, completed: true } : t)) || [],
    }));
    toast.success("Task completed");
  };

  const deleteTask = (taskId: string) => {
    updateData((d) => ({
      ...d,
      salesTasks: d.salesTasks?.filter((t) => t.id !== taskId) || [],
    }));
    toast.success("Task deleted");
  };

  if (isOpportunities) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Opportunities"
          description="Accounts that need placement, reorder nudges, or re-engagement."
        />

        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline ({filteredOpportunities.length})</TabsTrigger>
            <TabsTrigger value="tasks">My Tasks ({myTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search accounts or cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {(["all", "prospect", "reorder", "dormant"] as const).map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={filterType === type ? "default" : "outline"}
                    onClick={() => setFilterType(type)}
                  >
                    {type === "all" ? "All" : TYPE_LABELS[type].label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Opportunities List */}
            <div className="grid gap-4">
              {filteredOpportunities.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Target className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">No opportunities found</p>
                    <p className="text-sm text-muted-foreground">
                      Great job! All accounts are active and engaged.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredOpportunities.map((op) => {
                  const typeInfo = TYPE_LABELS[op.type];
                  return (
                    <Card key={op.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Left: Account Info */}
                          <div className="flex-1 p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <Badge className={typeInfo.color}>
                                <span className="mr-1">{typeInfo.icon}</span>
                                {typeInfo.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">Score: {op.score}</span>
                              {op.avgOrderValue && (
                                <span className="text-xs text-muted-foreground">
                                  AOV: ${op.avgOrderValue.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <h3 className="font-display text-lg font-semibold">{op.account.tradingName}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {op.account.city}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {op.account.type}
                              </span>
                              {op.daysSinceLastOrder && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {op.daysSinceLastOrder}d since order
                                </span>
                              )}
                            </div>
                            <div className="mt-3 rounded-lg bg-muted p-3">
                              <p className="text-sm font-medium text-amber-700">{op.reason}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Suggested: {op.suggestedAction}
                              </p>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex flex-row items-center gap-2 border-t bg-muted/30 p-4 sm:flex-col sm:border-l sm:border-t-0">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOpportunity(op);
                                setShowTaskModal(true);
                              }}
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Create Task
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/sales/accounts`}>
                                <ArrowUpRight className="mr-1 h-4 w-4" />
                                View Account
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/sales/orders?new=1&account=${op.accountId}`}>
                                <ShoppingCart className="mr-1 h-4 w-4" />
                                Draft Order
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {myTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No pending tasks</p>
                  <p className="text-sm text-muted-foreground">Create tasks from opportunities above.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myTasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{TASK_TYPE_LABELS[task.type]}</Badge>
                            <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                              {task.priority.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Due: {task.dueDate}
                            </span>
                          </div>
                          <p className="mt-1 font-medium">{task.accountName}</p>
                          {task.notes && <p className="text-sm text-muted-foreground">{task.notes}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => completeTask(task.id)}>
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Done
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteTask(task.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No completed tasks yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <Card key={task.id} className="opacity-60">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{TASK_TYPE_LABELS[task.type]}</span>
                            <span className="text-xs text-muted-foreground">• {task.accountName}</span>
                          </div>
                          {task.notes && <p className="text-sm text-muted-foreground">{task.notes}</p>}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteTask(task.id)}>
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Task Creation Modal */}
        {showTaskModal && selectedOpportunity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="font-display text-base">Create Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Account: <span className="font-medium text-foreground">{selectedOpportunity.account.tradingName}</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Task Type</label>
                    <select
                      value={newTask.type}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, type: e.target.value as Task["type"] }))}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="call">Phone Call</option>
                      <option value="visit">Field Visit</option>
                      <option value="email">Email</option>
                      <option value="demo">Product Demo</option>
                      <option value="follow-up">Follow-up</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value as Task["priority"] }))}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Notes</label>
                  <textarea
                    value={newTask.notes}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add details about this task..."
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateTask}>Create Task</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTaskModal(false);
                      setSelectedOpportunity(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Visits section
  return (
    <div className="space-y-6">
      <PageHeader
        title="Visit Notes"
        description="Field visit log tied to accounts."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Recent Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myVisitNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Phone className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No visit notes yet</p>
                <p className="text-sm text-muted-foreground">
                  Visit notes from the Sales Rep Home page appear here.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {myVisitNotes.map((note) => (
                    <div key={note.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{note.account}</span>
                          <span className="text-xs text-muted-foreground">• {note.at}</span>
                        </div>
                        <Badge variant="outline">{note.authorRep}</Badge>
                      </div>
                      <p className="text-sm">{note.body}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Visits Logged</p>
              <p className="font-display text-2xl font-bold">{myVisitNotes.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="font-display text-2xl font-bold">
                {
                  myVisitNotes.filter((n) => {
                    const noteDate = new Date(n.at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return noteDate >= weekAgo;
                  }).length
                }
              </p>
            </div>
            <Button className="w-full" asChild>
              <Link to="/sales">
                <Plus className="mr-2 h-4 w-4" />
                Log New Visit
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
