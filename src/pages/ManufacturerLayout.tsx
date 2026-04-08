import { Outlet, NavLink, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Factory, Globe, User } from "lucide-react";

export default function ManufacturerLayout() {
  const location = useLocation();
  
  // Determine active tab from pathname
  const getActiveTab = () => {
    if (location.pathname.includes("/market-demand")) return "market-demand";
    if (location.pathname.includes("/profile")) return "profile";
    return "overview";
  };

  return (
    <div>
      <PageHeader
        title="Manufacturer"
        description="Fulfillment view for open production requests raised by Hajime HQ — batch schedule, inbound shipment queue, demand by market, and alerts."
      />
      
      <Tabs value={getActiveTab()} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview" asChild>
            <NavLink to="/manufacturer" end>
              <Factory className="mr-2 h-4 w-4" />
              Overview
            </NavLink>
          </TabsTrigger>
          <TabsTrigger value="market-demand" asChild>
            <NavLink to="/manufacturer/market-demand">
              <Globe className="mr-2 h-4 w-4" />
              Market Demand
            </NavLink>
          </TabsTrigger>
          <TabsTrigger value="profile" asChild>
            <NavLink to="/manufacturer/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </NavLink>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Outlet />
    </div>
  );
}
