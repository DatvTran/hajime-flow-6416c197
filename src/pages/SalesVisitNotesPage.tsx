import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";
import { toast } from "@/components/ui/sonner";
import type { VisitNoteEntry } from "@/types/app-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageSquare, 
  Plus, 
  Calendar, 
  User, 
  Store,
  Search,
  Clock,
  TrendingUp,
  MapPin,
  Phone,
  ArrowRight,
  Filter
} from "lucide-react";

export default function SalesVisitNotesPage() {
  const { data, updateData } = useAppData();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [noteText, setNoteText] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitType, setVisitType] = useState<"in-person" | "phone" | "email" | "video">("in-person");

  const repName = useMemo(() => {
    return resolveSalesRepLabelForSession(user?.email, user?.displayName);
  }, [user]);

  const repAccounts = useMemo(() => {
    return data.accounts.filter(a => 
      a.salesOwner === repName && 
      ["retail", "bar", "restaurant", "hotel", "distributor"].includes(a.type)
    ).sort((a, b) => (a.tradingName || a.name).localeCompare(b.tradingName || b.name));
  }, [data.accounts, repName]);

  // Get visit notes from AppData (same as home page)
  const myNotes = useMemo(() => {
    const all = data.visitNotes || [];
    return all
      .filter(n => n.authorRep.trim() === repName.trim())
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [data.visitNotes, repName]);

  const filteredNotes = useMemo(() => {
    let notes = myNotes;
    
    if (search.trim()) {
      const query = search.toLowerCase();
      notes = notes.filter(n => 
        n.body.toLowerCase().includes(query) ||
        n.account.toLowerCase().includes(query)
      );
    }
    
    if (accountFilter !== "all") {
      notes = notes.filter(n => n.account === accountFilter);
    }
    
    return notes;
  }, [myNotes, search, accountFilter]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      total: myNotes.length,
      thisWeek: myNotes.filter(n => new Date(n.at) >= weekAgo).length,
      thisMonth: myNotes.filter(n => new Date(n.at) >= monthAgo).length,
      uniqueAccounts: new Set(myNotes.map(n => n.account)).size,
    };
  }, [myNotes]);

  // Notes grouped by account
  const notesByAccount = useMemo(() => {
    const grouped: Record<string, VisitNoteEntry[]> = {};
    for (const note of filteredNotes) {
      if (!grouped[note.account]) {
        grouped[note.account] = [];
      }
      grouped[note.account].push(note);
    }
    return grouped;
  }, [filteredNotes]);

  // Recent visits (last 5)
  const recentVisits = useMemo(() => {
    return myNotes.slice(0, 5);
  }, [myNotes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !noteText.trim()) {
      toast.error("Please select an account and enter a note");
      return;
    }

    const account = repAccounts.find(a => a.id === selectedAccount);
    const accountName = account?.tradingName || account?.name || "Unknown";

    const newNote: VisitNoteEntry = {
      id: `v-${Date.now()}`,
      at: `${visitDate}T${new Date().toTimeString().slice(0, 5)}`,
      account: accountName,
      body: `[${visitType.toUpperCase()}] ${noteText.trim()}`,
      authorRep: repName,
    };

    updateData(d => ({
      ...d,
      visitNotes: [newNote, ...(d.visitNotes || [])],
    }));

    toast.success("Visit note added", {
      description: `Logged for ${accountName}`,
    });
    
    setNoteText("");
    setSelectedAccount("");
    setShowForm(false);
  };

  const getVisitTypeIcon = (body: string) => {
    if (body.includes("[IN-PERSON]")) return <Store className="h-4 w-4" />;
    if (body.includes("[PHONE]")) return <Phone className="h-4 w-4" />;
    if (body.includes("[VIDEO]")) return <TrendingUp className="h-4 w-4" />;
    return <MessageSquare className="h-4 w-4" />;
  };

  const stripTypePrefix = (body: string) => {
    return body.replace(/^\[(IN-PERSON|PHONE|EMAIL|VIDEO)\]\s*/, "");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visit Notes"
        description="Log and review field visits with your accounts."
        actions={
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Cancel" : "Log Visit"}
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-blue-600">{stats.thisWeek}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-green-600">{stats.thisMonth}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accounts Visited</p>
                <p className="text-2xl font-bold text-amber-600">{stats.uniqueAccounts}</p>
              </div>
              <Store className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Log New Visit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Account *</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {repAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <span>{account.tradingName || account.name}</span>
                            {account.city && (
                              <span className="text-xs text-muted-foreground">({account.city})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Visit Type</Label>
                  <Select value={visitType} onValueChange={(v) => setVisitType(v as "in-person" | "phone" | "email" | "video")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In-Person</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Visit Date *</Label>
                  <Input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Note *</Label>
                <Textarea
                  placeholder="What did you discuss? Any follow-ups needed? Stock levels? New opportunities?"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Save Visit Note
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {repAccounts.map((account) => (
                <SelectItem key={account.id} value={account.tradingName || account.name}>
                  {account.tradingName || account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline ({filteredNotes.length})</TabsTrigger>
          <TabsTrigger value="by-account">By Account ({Object.keys(notesByAccount).length})</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Timeline View */}
        <TabsContent value="timeline">
          {filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-2 text-center">
                  <MessageSquare className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                  <p className="text-sm font-medium text-muted-foreground">No visit notes found</p>
                  <p className="text-xs text-muted-foreground">
                    {search || accountFilter !== "all" 
                      ? "Try adjusting your filters"
                      : "Start logging your field visits to build a history with your accounts."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => {
                const account = repAccounts.find(a => 
                  (a.tradingName || a.name) === note.account
                );
                
                return (
                  <Card key={note.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getVisitTypeIcon(note.body)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{note.account}</span>
                            {account?.city && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {account.city}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm whitespace-pre-wrap">
                            {stripTypePrefix(note.body)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* By Account View */}
        <TabsContent value="by-account">
          {Object.keys(notesByAccount).length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Store className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                  <p className="text-sm font-medium text-muted-foreground">No accounts with visits</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(notesByAccount).map(([accountName, notes]) => {
                const account = repAccounts.find(a => 
                  (a.tradingName || a.name) === accountName
                );
                const lastVisit = notes[0];
                
                return (
                  <Card key={accountName}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          {accountName}
                        </div>
                        <Badge variant="secondary">{notes.length} visits</Badge>
                      </CardTitle>
                      {account?.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {account.city}
                          {account.type && ` • ${account.type}`}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-3">
                          {notes.map((note) => (
                            <div key={note.id} className="border-l-2 border-primary pl-3 py-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                {getVisitTypeIcon(note.body)}
                                <span>{new Date(note.at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm line-clamp-2">
                                {stripTypePrefix(note.body)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-3"
                        asChild
                      >
                        <Link to={`/sales/accounts`}>
                          View Account
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Recent Activity View */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentVisits.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <MessageSquare className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">No recent visits logged</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentVisits.map((note, index) => (
                    <div key={note.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {getVisitTypeIcon(note.body)}
                        </div>
                        {index < recentVisits.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{note.account}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {stripTypePrefix(note.body)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
