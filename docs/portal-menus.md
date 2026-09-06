# Portal menus (locked)

Do **not** add, remove, rename, or reorder sidebar items unless the user **explicitly** asks to change that menu.

Clearing demo data, emptying lists, or changing page content is **not** permission to hide a nav item. Keep the route and the label; an empty state is fine.

Canonical source: the arrays in the sidebar files below. Update this doc in the **same change** if a menu is intentionally edited.

---

## HQ (`HqOperatorSidebar.tsx`)

**Command**

1. Dashboard → `/`
2. Expo leads → `/expo-leads`
3. Export orders → `/export-orders`
4. Product Development → `/product-development`
5. Replenishment orders → `/orders?view=replenishment`
6. Distributor orders → `/orders`
7. Distributor sales → `/accounts?view=sales`
8. Markets & allocation → `/markets`

**Network**

1. Distilleries → `/manufacturer/profiles`
2. Distributors → `/accounts`
3. Retail accounts → `/accounts?view=retail`
4. Sales reps → `/crm?role=sales_rep`

**Brand**

1. Incentive programs → `/incentives`
2. Product catalog → `/inventory`
3. Brand kit → `/brand-kit`
4. Analytics → `/reports`
5. Settings → `/settings`

HQ Command does **not** include Production requests (`/production-requests`). Do not add it back unless asked.

---

## Distributor (`DistributorSidebar.tsx`)

**Operations:** Dashboard, International orders, Purchase orders, Inventory, Pick & pack  
**Logistics:** Shipments, Delivery schedule, Retail accounts, Sales reps  
**Performance:** Partner program, Analytics & reports, Support

---

## Distillery (`ManufacturerSidebar.tsx`)

**Production:** Dashboard, Export authorizations, Production requests, Brew batches, Bottling line  
**Supply:** Raw materials, Finished goods, Shipments to HQ  
**Quality:** Quality control, Analytics & reports, Support
