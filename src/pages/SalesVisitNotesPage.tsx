import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAccounts } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";
import { createVisitNote, getVisitNotes } from "@/lib/api-v1-mutations";
import { toast } from "@/components/ui/sonner";
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
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface VisitNote {
  id: string;
  account_id: string;
  account_name?: string;
  note: string;
  visit_date: string;
  created_by?: string;
  created_at: string;
}

export default function SalesVisitNotesPage() {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const [notes, setNotes] = useState<VisitNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [noteText, setNoteText] = useState("");
  const [visitDate, setVisitDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const repName = useMemo(() => {
    return resolveSalesRepLabelForSession(user?.email, user?.displayName);
  }, [user]);

  const repAccounts = useMemo(() => {
    return accounts.filter(a => 
      a.salesOwner === repName && 
      ["retail", "bar", "restaurant", "hotel", "distributor"].includes(a.type)
    ).sort((a, b) => (a.tradingName || a.name).localeCompare(b.tradingName || b.name));
  }, [accounts, repName]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const response = await getVisitNotes({ 
        sales_rep: repName,
        limit: 50 
      });
      // Enrich with account names
      const enrichedNotes = response.data.map((note: VisitNote) => {
        const account = accounts.find(a => a.id === note.account_id);
        return { ...note, account_name: account?.tradingName || account?.name || "Unknown" };
      });
      setNotes(enrichedNotes);
    } catch (err: any) {
      toast.error("Failed to load visit notes", { description: err.message });
      // Fallback to empty array for now
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [repName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !noteText.trim()) {
      toast.error("Please select an account and enter a note");
      return;
    }

    setIsSubmitting(true);
    try {
      await createVisitNote({
        account_id: selectedAccount,
        note: noteText.trim(),
        visit_date: visitDate,
      });
      toast.success("Visit note added");
      setNoteText("");
      setSelectedAccount("");
      setShowForm(false);
      fetchNotes();
    } catch (err: any) {
      toast.error("Failed to save note", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes;
    const query = search.toLowerCase();
    return notes.filter(n => 
      n.note.toLowerCase().includes(query) ||
      n.account_name?.toLowerCase().includes(query)
    );
  }, [notes, search]);

  const notesByAccount = useMemo(() => {
    const grouped: Record<string, VisitNote[]> = {};
    for (const note of filteredNotes) {
      if (!grouped[note.account_id]) {
        grouped[note.account_id] = [];
      }
      grouped[note.account_id].push(note);
    }
    return grouped;
  }, [filteredNotes]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visit Notes"
        description="Log and review field visits with your accounts."
        actions={
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Cancel" : "Add Visit Note"}
          </Button>
        }
      />

      {/* Add Note Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Visit Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account">Account *</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {repAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.tradingName || account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="visitDate">Visit Date *</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note">Note *</Label>
                <Textarea
                  id="note"
                  placeholder="What did you discuss? Any follow-ups needed?"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Visit Note
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No visit notes yet</p>
            <p className="text-muted-foreground">
              Start logging your field visits to build a history with your accounts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(notesByAccount).map(([accountId, accountNotes]) => {
            const account = accounts.find(a => a.id === accountId);
            const accountName = account?.tradingName || account?.name || "Unknown Account";
            
            return (
              <Card key={accountId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    {accountName}
                    <span className="text-muted-foreground font-normal">
                      ({accountNotes.length} notes)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {accountNotes
                    .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())
                    .map((note) => (
                      <div key={note.id} className="border-l-2 border-primary pl-4 py-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(note.visit_date), "MMM d, yyyy")}
                          <span className="mx-1">•</span>
                          <User className="h-3 w-3" />
                          {note.created_by || "You"}
                        </div>
                        <p className="whitespace-pre-wrap">{note.note}</p>
                      </div>
                    ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
