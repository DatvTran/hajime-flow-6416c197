import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { accounts } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, MapPin, Mail, Phone } from "lucide-react";
import { useState } from "react";

export default function Accounts() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"table" | "cards">("cards");
  const filtered = accounts.filter(
    (a) => a.tradingName.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Manage customer accounts and relationships"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />New Account</Button>
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search accounts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex rounded-lg border">
          <button onClick={() => setView("cards")} className={`px-3 py-1.5 text-xs font-medium ${view === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground"} rounded-l-lg transition-colors`}>Cards</button>
          <button onClick={() => setView("table")} className={`px-3 py-1.5 text-xs font-medium ${view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground"} rounded-r-lg transition-colors`}>Table</button>
        </div>
      </div>

      {view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold">{account.tradingName}</h3>
                    <p className="text-xs text-muted-foreground">{account.legalName}</p>
                  </div>
                  <StatusBadge status={account.status} />
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{account.city}, {account.country}</div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{account.email}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{account.phone}</div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="text-xs"><span className="text-muted-foreground">Avg Order:</span> <span className="font-medium">${account.avgOrderSize.toLocaleString()}</span></div>
                  <div className="text-xs"><span className="text-muted-foreground">Owner:</span> <span className="font-medium">{account.salesOwner}</span></div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {account.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Account</th>
                    <th className="pb-3 font-medium text-muted-foreground">Type</th>
                    <th className="pb-3 font-medium text-muted-foreground">City</th>
                    <th className="pb-3 font-medium text-muted-foreground">Contact</th>
                    <th className="pb-3 font-medium text-muted-foreground">Sales Owner</th>
                    <th className="pb-3 font-medium text-muted-foreground">Avg Order</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((acc) => (
                    <tr key={acc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium">{acc.tradingName}</td>
                      <td className="py-3 capitalize">{acc.type}</td>
                      <td className="py-3">{acc.city}</td>
                      <td className="py-3">{acc.contactName}</td>
                      <td className="py-3">{acc.salesOwner}</td>
                      <td className="py-3">${acc.avgOrderSize.toLocaleString()}</td>
                      <td className="py-3"><StatusBadge status={acc.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
