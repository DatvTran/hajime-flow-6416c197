import { useState } from "react";
import { MessageSquare, Plus, Clock, CheckCircle2, AlertCircle, Search, Filter, Send, Paperclip } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  createSupportTicket,
  createTicketReply,
  updateTicketStatus,
  getSupportTickets,
} from "@/lib/api-v1-mutations";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { RetailSkeleton } from "@/components/skeletons";
import { toast } from "@/components/ui/sonner";

type TicketStatus = "open" | "in-progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";
type TicketCategory = "order" | "payment" | "delivery" | "product" | "account" | "other";

interface TicketMessage {
  id: string;
  author: string;
  authorRole: "retail" | "support" | "ops";
  body: string;
  sentAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  orderId?: string;
}

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  order: "Order Issue",
  payment: "Payment & Billing",
  delivery: "Delivery Problem",
  product: "Product Question",
  account: "Account Help",
  other: "Other",
};

const STATUS_LABELS: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Open", variant: "default" },
  "in-progress": { label: "In Progress", variant: "secondary" },
  resolved: { label: "Resolved", variant: "outline" },
  closed: { label: "Closed", variant: "outline" },
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: "text-slate-600",
  medium: "text-blue-600",
  high: "text-orange-600",
  urgent: "text-red-600",
};

export default function RetailSupportPage() {
  const { user } = useAuth();
  const { data, updateData, loading } = useAppData();

  if (loading) {
    return <RetailSkeleton />;
  }

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");

  // Get tickets from AppData or initialize empty array
  const tickets: SupportTicket[] = data.supportTickets || [];

  // Filter tickets for this retail account
  const myTickets = tickets.filter((t) => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const [newTicket, setNewTicket] = useState<Partial<SupportTicket>>({
    subject: "",
    category: "other",
    priority: "medium",
    messages: [],
  });

  const handleCreateTicket = async () => {
    if (!newTicket.subject?.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!newTicket.messages?.[0]?.body?.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    try {
      const result = await createSupportTicket({
        title: newTicket.subject.trim(),
        description: newTicket.messages[0].body.trim(),
        priority: (newTicket.priority as TicketPriority) || "medium",
        category: (newTicket.category as string) || "other",
      });

      const ticket: SupportTicket = {
        id: result.data.id,
        subject: newTicket.subject,
        category: (newTicket.category as TicketCategory) || "other",
        priority: (newTicket.priority as TicketPriority) || "medium",
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: `msg-${Date.now()}`,
            author: user.displayName || user.email,
            authorRole: "retail",
            body: newTicket.messages[0].body,
            sentAt: new Date().toISOString(),
          },
        ],
        orderId: newTicket.orderId,
      };

      updateData((d) => ({
        ...d,
        supportTickets: [ticket, ...(d.supportTickets || [])],
      }));

      toast.success("Ticket created", { description: `Ticket ${ticket.id} saved to server` });
      setIsCreating(false);
      setNewTicket({ subject: "", category: "other", priority: "medium", messages: [] });
      setSelectedTicket(ticket);
    } catch (err) {
      console.error("[RetailSupport] Failed to create ticket:", err);
      toast.error("Failed to save to server", { description: "Ticket saved locally — will sync when online." });

      const ticket: SupportTicket = {
        id: `TKT-${Date.now()}`,
        subject: newTicket.subject,
        category: (newTicket.category as TicketCategory) || "other",
        priority: (newTicket.priority as TicketPriority) || "medium",
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: `msg-${Date.now()}`,
            author: user.displayName || user.email,
            authorRole: "retail",
            body: newTicket.messages[0].body,
            sentAt: new Date().toISOString(),
          },
        ],
        orderId: newTicket.orderId,
      };

      updateData((d) => ({
        ...d,
        supportTickets: [ticket, ...(d.supportTickets || [])],
      }));

      setIsCreating(false);
      setNewTicket({ subject: "", category: "other", priority: "medium", messages: [] });
      setSelectedTicket(ticket);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    try {
      await createTicketReply(selectedTicket.id, replyText.trim());

      const message: TicketMessage = {
        id: `msg-${Date.now()}`,
        author: user.displayName || user.email,
        authorRole: "retail",
        body: replyText,
        sentAt: new Date().toISOString(),
      };

      updateData((d) => ({
        ...d,
        supportTickets: d.supportTickets?.map((t) =>
          t.id === selectedTicket.id
            ? {
                ...t,
                messages: [...t.messages, message],
                updatedAt: new Date().toISOString(),
              }
            : t
        ) || [],
      }));

      setReplyText("");
      toast.success("Reply sent", { description: "Saved to server." });
    } catch (err) {
      console.error("[RetailSupport] Failed to send reply:", err);
      toast.error("Failed to save to server", { description: "Reply saved locally." });

      const message: TicketMessage = {
        id: `msg-${Date.now()}`,
        author: user.displayName || user.email,
        authorRole: "retail",
        body: replyText,
        sentAt: new Date().toISOString(),
      };

      updateData((d) => ({
        ...d,
        supportTickets: d.supportTickets?.map((t) =>
          t.id === selectedTicket.id
            ? {
                ...t,
                messages: [...t.messages, message],
                updatedAt: new Date().toISOString(),
              }
            : t
        ) || [],
      }));

      setReplyText("");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Get help with orders, deliveries, payments, and account questions."
      />

      {!selectedTicket ? (
        <>
          {/* Ticket List Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[240px]"
                />
              </div>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TicketStatus | "all")}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </div>

          {/* New Ticket Form */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Create New Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newTicket.category}
                      onValueChange={(v) => setNewTicket((prev) => ({ ...prev, category: v as TicketCategory }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(v) => setNewTicket((prev) => ({ ...prev, priority: v as TicketPriority }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Related Order ID (optional)</Label>
                    <Input
                      value={newTicket.orderId || ""}
                      onChange={(e) => setNewTicket((prev) => ({ ...prev, orderId: e.target.value }))}
                      placeholder="e.g., SO-2024-001"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newTicket.messages?.[0]?.body || ""}
                    onChange={(e) =>
                      setNewTicket((prev) => ({
                        ...prev,
                        messages: [{ id: "temp", author: "", authorRole: "retail", body: e.target.value, sentAt: "" }],
                      }))
                    }
                    placeholder="Describe your issue in detail..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateTicket}>Submit Ticket</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tickets List */}
          {myTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No tickets yet</p>
                <p className="text-sm text-muted-foreground">
                  Need help? Create a ticket and our team will assist you.
                </p>
                {!isCreating && (
                  <Button className="mt-4" onClick={() => setIsCreating(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Ticket
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myTickets.map((ticket) => {
                const status = STATUS_LABELS[ticket.status];
                const lastMessage = ticket.messages[ticket.messages.length - 1];
                return (
                  <Card
                    key={ticket.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{ticket.id}</span>
                            <Badge variant={status.variant}>{status.label}</Badge>
                            <span className={`text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                              {ticket.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="mt-1 truncate font-medium">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {CATEGORY_LABELS[ticket.category]}
                            {ticket.orderId && ` • ${ticket.orderId}`}
                          </p>
                          {lastMessage && (
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              Last: {lastMessage.body.slice(0, 100)}
                              {lastMessage.body.length > 100 && "..."}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(ticket.updatedAt)}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {ticket.messages.length} {ticket.messages.length === 1 ? "message" : "messages"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Ticket Detail View */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              ← Back to Tickets
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{selectedTicket.id}</span>
                    <Badge variant={STATUS_LABELS[selectedTicket.status].variant}>
                      {STATUS_LABELS[selectedTicket.status].label}
                    </Badge>
                    <span className={`text-xs font-medium ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </div>
                  <CardTitle className="font-display mt-2 text-lg">{selectedTicket.subject}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORY_LABELS[selectedTicket.category]}
                    {selectedTicket.orderId && ` • Order ${selectedTicket.orderId}`}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>Created: {formatDate(selectedTicket.createdAt)}</p>
                  <p>Updated: {formatDate(selectedTicket.updatedAt)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {selectedTicket.messages.map((msg, idx) => (
                    <div key={msg.id}>
                      {idx > 0 && <Separator className="my-4" />}
                      <div className={`flex gap-3 ${msg.authorRole === "retail" ? "flex-row" : "flex-row-reverse"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.authorRole === "retail"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                            <span className="font-medium">
                              {msg.authorRole === "retail" ? "You" : msg.author}
                            </span>
                            <span>{formatDate(msg.sentAt)}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <Paperclip className="mr-2 h-4 w-4" />
                        Attach File
                      </Button>
                      <Button onClick={handleReply} disabled={!replyText.trim()}>
                        <Send className="mr-2 h-4 w-4" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {(selectedTicket.status === "resolved" || selectedTicket.status === "closed") && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  This ticket has been resolved. If you need further assistance, please create a new ticket.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Quick Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="font-medium">Common Issues</p>
                  <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                    <li>• Delivery delays: Check shipment tracker first</li>
                    <li>• Missing items: Include order ID and photos</li>
                    <li>• Payment issues: Verify card on file is current</li>
                    <li>• Product questions: Check catalog specifications</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
