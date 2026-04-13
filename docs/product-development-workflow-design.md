# New Product Development Workflow Design

## Overview
A complete workflow for Brand Operators to request new product development from manufacturers, with feasibility review, proposal exchange, and gated approval before production begins.

---

## User Stories

### Brand Operator
> "I want to create a new coffee rhum variant (hazelnut, 30% ABV) and send it to Kirin for feasibility review. They should tell me if they can make it, how much it costs, and when it could ship."

### Manufacturer
> "I see a new product request from Hajime. I need to review the specs, check if our equipment can produce it, calculate costs, and send back a proposal. If approved, it becomes a production PO."

---

## Workflow Stages

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEW PRODUCT DEVELOPMENT PIPELINE                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│  │   DRAFT      │────▶│  SUBMITTED   │────▶│  UNDER REVIEW│            │
│  │  (Brand)     │     │  (Brand)     │     │(Manufacturer)│            │
│  └──────────────┘     └──────────────┘     └──────┬───────┘            │
│                                                   │                     │
│                           ┌───────────────────────┘                     │
│                           ▼                                             │
│                  ┌──────────────┐     ┌──────────────┐                 │
│                  │   DECLINED   │     │   PROPOSED   │                 │
│                  │(Manufacturer)│     │(Manufacturer)│                 │
│                  └──────────────┘     └──────┬───────┘                 │
│                                              │                          │
│                           ┌──────────────────┘                          │
│                           ▼                                             │
│                  ┌──────────────┐     ┌──────────────┐                 │
│                  │   REJECTED   │     │   APPROVED   │                 │
│                  │   (Brand)    │     │   (Brand)    │                 │
│                  └──────────────┘     └──────┬───────┘                 │
│                                              │                          │
│                           ┌──────────────────┘                          │
│                           ▼                                             │
│                  ┌──────────────────────────────────┐                  │
│                  │      PRODUCTION PO CREATED       │                  │
│                  │   (Auto-generates SKU on ship)   │                  │
│                  └──────────────────────────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### 1. NewProductRequest (New Entity)

```typescript
interface NewProductRequest {
  id: string;                    // NPR-2025-0001
  title: string;                 // "Hazelnut Coffee Rhum 30%"
  
  // Requested by
  requestedBy: string;           // Brand Operator user ID
  requestedAt: string;           // ISO date
  
  // Product Specs (Brand fills)
  specs: {
    baseSpirit: "coffee_rhum" | "coffee_vodka" | "coffee_whiskey" | string;
    targetAbv: number;           // 25-40%
    flavorProfile: string[];     // ["hazelnut", "vanilla"]
    sweetener?: string;          // "cane_sugar", "honey", "none"
    targetPricePoint: "premium" | "super_premium" | "ultra_premium";
    packaging: {
      bottleSize: "750ml" | "1000ml" | "375ml";
      labelStyle: string;        // Reference to design brief
      caseConfiguration: number; // 6, 12 bottles
    };
    minimumOrderQuantity: number; // bottles
    targetLaunchDate: string;     // ISO date
    regulatoryMarkets: string[];  // ["Ontario", "EU", "US"]
  };
  
  // Reference materials
  attachments: {
    name: string;
    url: string;
    type: "design_brief" | "tasting_notes" | "competitor_analysis" | "other";
  }[];
  
  // Internal notes
  notes: string;
  
  // Status
  status: "draft" | "submitted" | "under_review" | "proposed" | 
          "approved" | "rejected" | "declined";
  
  // Assigned to manufacturer
  assignedManufacturer?: string;  // "Kirin Brewery Co."
  
  // Timeline
  submittedAt?: string;
  reviewStartedAt?: string;
  proposalReceivedAt?: string;
  decidedAt?: string;
  
  // Manufacturer Proposal (filled when status="proposed")
  manufacturerProposal?: {
    feasible: boolean;
    canHitAbv: boolean;
    proposedAbv?: number;
    
    // Production details
    production: {
      equipmentRequired: string[];
      fermentationTime: string;    // "14 days"
      agingTime?: string;          // "3 months" (if applicable)
      batchSize: number;           // bottles per batch
      minimumBatchSize: number;
      capacityAvailable: boolean;
    };
    
    // Costing
    costs: {
      perBottleProduction: number; // USD
      perBottlePackaging: number;
      perBottleLabeling: number;
      setupFee?: number;           // One-time for new products
      totalPerBottle: number;
    };
    
    // Timeline
    timeline: {
      sampleAvailableDate: string;
      productionStartDate: string;
      firstDeliveryDate: string;
    };
    
    // Notes
    technicalNotes: string;        // "Will need to adjust pH for stability"
    regulatoryNotes: string;       // "30% ABV requires different label in EU"
    
    // Sample shipment
    sampleQuantity: number;        // bottles for approval
    sampleShipDate: string;
  };
  
  // Brand decision
  brandDecision?: {
    approved: boolean;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    requestedChanges?: string;
  };
  
  // Linked entities
  sampleShipmentId?: string;     // Linked shipment for samples
  productionPoId?: string;       // Created on approval
  resultingSku?: string;         // Populated when PO ships
}
```

### 2. ProductProposal (Manufacturer Response)

```typescript
// Embedded in NewProductRequest.manufacturerProposal
// But can be expanded to full entity if needed
```

---

## UI Flow

### Brand Operator View

#### 1. New Product Requests List
**Path:** `/product-development` or `/purchase-orders?tab=new-products`

```
┌─────────────────────────────────────────────────────────────┐
│  Product Development Pipeline              [+ New Request]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filter: [All] [Draft] [Under Review] [Approved] [Declined] │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟡 NPR-2025-0001  Hazelnut Coffee Rhum 30%          │   │
│  │    Status: Under Review • Kirin Brewery Co.         │   │
│  │    Submitted: Apr 10, 2025 • Target: Q3 2025        │   │
│  │    [View Details]                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 NPR-2025-0002  Vanilla Cold Brew Liqueur         │   │
│  │    Status: Approved • Production PO: PO-2025-0089   │   │
│  │    Approved: Apr 8, 2025 • Ship: Jun 15, 2025       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2. New Product Request Dialog
**Create Mode:**

```
┌────────────────────────────────────────────────────────────┐
│           New Product Development Request                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Product Name                                              │
│  [Hazelnut Coffee Rhum 30%                           ]    │
│                                                            │
│  Base Spirit                    Target ABV                 │
│  [Coffee Rhum          ▼]       [30                   %]  │
│                                                            │
│  Flavor Profile (comma separated)                          │
│  [hazelnut, vanilla, caramel                         ]    │
│                                                            │
│  Target Price Point                                        │
│  ( ) Premium  (●) Super Premium  ( ) Ultra Premium        │
│                                                            │
│  ─── Packaging ───                                         │
│  Bottle: [750ml ▼]  Case: [12 bottles ▼]                   │
│                                                            │
│  Minimum Order: [1,200        ] bottles                    │
│                                                            │
│  Target Launch: [2025-09-01   ]                            │
│                                                            │
│  Regulatory Markets:                                       │
│  [☑] Ontario  [☑] EU  [☑] US  [☐] Japan                   │
│                                                            │
│  Design Brief: [Upload file...]                            │
│                                                            │
│  Notes:                                                    │
│  [Competitor: Mr Black, but higher ABV              ]     │
│  [                                                 ]       │
│                                                            │
│  Manufacturer: [Kirin Brewery Co.                ▼]       │
│                                                            │
│                           [Save Draft]  [Submit Request]   │
└────────────────────────────────────────────────────────────┘
```

#### 3. Request Detail (Under Review)

```
┌────────────────────────────────────────────────────────────┐
│  NPR-2025-0001  Hazelnut Coffee Rhum 30%        [Back]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Status: 🟡 UNDER REVIEW                                   │
│  Manufacturer: Kirin Brewery Co.                           │
│  Submitted: Apr 10, 2025                                   │
│  Review Started: Apr 11, 2025                              │
│                                                            │
│  ─── YOUR SPECIFICATIONS ───                               │
│  [Display all specs read-only]                             │
│                                                            │
│  ─── MANUFACTURER PROPOSAL ───                             │
│  ⏳ Awaiting proposal...                                   │
│                                                            │
│  [Cancel Request]  [Message Manufacturer]                  │
└────────────────────────────────────────────────────────────┘
```

#### 4. Request Detail (Proposal Received)

```
┌────────────────────────────────────────────────────────────┐
│  NPR-2025-0001  Hazelnut Coffee Rhum 30%                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Status: 🟢 PROPOSAL RECEIVED                              │
│                                                            │
│  ╔══════════════════════════════════════════════════════╗  │
│  ║  KIRIN BREWERY CO. PROPOSAL                          ║  │
│  ╠══════════════════════════════════════════════════════╣  │
│  ║                                                      ║  │
│  ║  ✅ Feasibility: CAN PRODUCE                         ║  │
│  ║                                                      ║  │
│  ║  ─── Production ───                                  ║  │
│  ║  • Batch size: 2,400 bottles                         ║  │
│  ║  • Fermentation: 14 days                             ║  │
│  ║  • First delivery: Jul 15, 2025                      ║  │
│  ║                                                      ║  │
│  ║  ─── Costing ───                                     ║  │
│  ║  • Production: $8.50/bottle                          ║  │
│  ║  • Packaging:   $2.20/bottle                         ║  │
│  ║  • Labeling:    $0.80/bottle                         ║  │
│  ║  • Setup fee:   $5,000 (one-time)                    ║  │
│  ║  • ─────────────────────                             ║  │
│  ║  • Total:      $11.50/bottle + setup                 ║  │
│  ║                                                      ║  │
│  ║  ─── Timeline ───                                    ║  │
│  ║  • Sample available: May 20, 2025                    ║  │
│  ║  • Production start: Jun 1, 2025                     ║  │
│  ║  • First delivery:   Jul 15, 2025                    ║  │
│  ║                                                      ║  │
│  ║  ─── Notes ───                                       ║  │
│  ║  "30% ABV is achievable. Recommend adding            ║  │
│  ║   stabilizer for hazelnut oils. Sample will          ║  │
│  ║   demonstrate final mouthfeel."                      ║  │
│  ║                                                      ║  │
│  ║  Sample shipment: 12 bottles, May 22, 2025          ║  │
│  ║                                                      ║  │
│  ╚══════════════════════════════════════════════════════╝  │
│                                                            │
│  [Reject]  [Request Changes]  [Approve → Create PO]        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### 5. Approval → Auto-Create PO

On "Approve":
```
┌────────────────────────────────────────────────────────────┐
│           Create Production Purchase Order                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Based on: NPR-2025-0001                                   │
│  Product: Hazelnut Coffee Rhum 30%                         │
│                                                            │
│  Pre-filled from proposal:                                 │
│  • Manufacturer: Kirin Brewery Co.                         │
│  • SKU: [AUTO-GENERATED ON SHIP]                          │
│  • Quantity: [1,200          ] bottles (min: 2,400)       │
│  • Target ABV: 30%                                         │
│  • Label version: v1.0 (new product)                       │
│                                                            │
│  ─── Dates ───                                             │
│  • Sample delivery: May 20, 2025                           │
│  • Production start: Jun 1, 2025                           │
│  • First delivery: Jul 15, 2025                            │
│                                                            │
│  [Edit Terms]  [Create Production PO]                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Manufacturer View

#### 1. New Product Inbox
**Path:** `/manufacturer/product-requests`

```
┌─────────────────────────────────────────────────────────────┐
│  New Product Requests                      [Production POs] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Pending Review ▼] [All Requests ▼]                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 2 NEW REQUESTS                                   │   │
│  │                                                     │   │
│  │ NPR-2025-0001  Hazelnut Coffee Rhum 30%             │   │
│  │ From: Hajime (Brand Operator: Sarah)                │   │
│  │ Submitted: Apr 10, 2025                             │   │
│  │ Target: Q3 2025  •  Markets: Ontario, EU, US        │   │
│  │ [Review & Respond]                                  │   │
│  │                                                     │   │
│  │ ─────────────────────────────────────────────────   │   │
│  │                                                     │   │
│  │ NPR-2025-0003  Spicy Mocha Blend                    │   │
│  │ From: Hajime (Brand Operator: Mike)                 │   │
│  │ Submitted: Apr 12, 2025                             │   │
│  │ Target: Q4 2025                                     │   │
│  │ [Review & Respond]                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─── IN REVIEW ───                                          │
│  NPR-2025-0002  (review started Apr 9)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Review & Respond

```
┌────────────────────────────────────────────────────────────┐
│  Review Product Request: NPR-2025-0001        [Back]       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ─── HAJIME SPECIFICATIONS ───                             │
│  Product: Hazelnut Coffee Rhum 30%                         │
│  Target ABV: 30%                                           │
│  Flavors: hazelnut, vanilla, caramel                       │
│  MOQ: 1,200 bottles                                        │
│  Target launch: Sep 1, 2025                                │
│                                                            │
│  [View Full Specs]  [Download Design Brief]                │
│                                                            │
│  ─── YOUR ASSESSMENT ───                                   │
│                                                            │
│  Can you produce this?  (●) Yes  ( ) No                    │
│                                                            │
│  ─── Production Details ───                                │
│  Equipment needed:                                          │
│  [☑] Standard still    [☑] Fermentation tanks             │
│  [☐] Aging barrels     [☑] Hazelnut infusion station      │
│                                                            │
│  Fermentation time: [14        ] days                      │
│  Batch size:        [2,400     ] bottles                   │
│  Minimum batch:     [2,400     ] bottles                   │
│                                                            │
│  ─── Costing ───                                           │
│  Production per bottle:  $[8.50      ]                     │
│  Packaging per bottle:   $[2.20      ]                     │
│  Labeling per bottle:    $[0.80      ]                     │
│  One-time setup fee:     $[5,000     ]                     │
│  ─────────────────────────────────────                     │
│  Total per bottle:       $11.50                            │
│                                                            │
│  ─── Timeline ───                                          │
│  Sample available:   [2025-05-20  ]                        │
│  Production start:   [2025-06-01  ]                        │
│  First delivery:     [2025-07-15  ]                        │
│                                                            │
│  ─── Sample Shipment ───                                   │
│  Sample bottles: [12           ]                           │
│  Ship samples:   [2025-05-22   ]                           │
│                                                            │
│  ─── Notes ───                                             │
│  Technical notes:                                          │
│  [30% ABV achievable. Recommend stabilizer for oils]      │
│                                                            │
│  Regulatory notes:                                         │
│  [EU label will need ABV warning at 30%]                  │
│                                                            │
│  [Decline]  [Save Draft]  [Submit Proposal]                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Database Schema

```sql
-- New table: new_product_requests
CREATE TABLE new_product_requests (
  id TEXT PRIMARY KEY,           -- NPR-YYYY-NNNN
  title TEXT NOT NULL,
  requested_by TEXT NOT NULL,    -- user_id
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Specs (JSONB for flexibility)
  specs JSONB NOT NULL,
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  CHECK (status IN ('draft', 'submitted', 'under_review', 'proposed', 
                    'approved', 'rejected', 'declined')),
  
  -- Assignment
  assigned_manufacturer TEXT,
  
  -- Timeline
  submitted_at TIMESTAMP,
  review_started_at TIMESTAMP,
  proposal_received_at TIMESTAMP,
  decided_at TIMESTAMP,
  
  -- Manufacturer proposal (JSONB)
  manufacturer_proposal JSONB,
  
  -- Brand decision
  brand_decision JSONB,
  
  -- Links
  sample_shipment_id TEXT,
  production_po_id TEXT,
  resulting_sku TEXT,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_npr_status ON new_product_requests(status);
CREATE INDEX idx_npr_manufacturer ON new_product_requests(assigned_manufacturer);
CREATE INDEX idx_npr_requested_by ON new_product_requests(requested_by);
CREATE INDEX idx_npr_po_link ON new_product_requests(production_po_id);
```

### API Endpoints

```
# Brand Operator endpoints
GET    /api/v1/new-product-requests              # List (scoped by role)
POST   /api/v1/new-product-requests              # Create draft
GET    /api/v1/new-product-requests/:id          # Get details
PATCH  /api/v1/new-product-requests/:id          # Update draft
POST   /api/v1/new-product-requests/:id/submit   # Submit for review
POST   /api/v1/new-product-requests/:id/approve  # Approve proposal → creates PO
POST   /api/v1/new-product-requests/:id/reject   # Reject proposal

# Manufacturer endpoints
GET    /api/v1/manufacturer/product-requests     # List assigned requests
PATCH  /api/v1/new-product-requests/:id/proposal # Submit proposal
POST   /api/v1/new-product-requests/:id/decline  # Decline request
```

### Client-Side Changes

**New Files:**
```
src/
├── pages/
│   ├── ProductDevelopmentPage.tsx          # List view
│   └── ProductRequestDetailPage.tsx        # Detail view
├── components/
│   ├── NewProductRequestDialog.tsx         # Create/edit form
│   ├── ManufacturerProposalDialog.tsx      # Manufacturer response
│   ├── ProductRequestCard.tsx              # List item component
│   └── ProductRequestTimeline.tsx          # Visual status timeline
├── lib/
│   └── product-development.ts              # Helpers, validators
└── data/
    └── newProductRequests.ts               # Mock data
```

**Modified Files:**
```
src/
├── components/
│   └── AppSidebar.tsx                      # Add "Product Development" nav
├── pages/
│   ├── ManufacturerHomePage.tsx            # Add "New Product Inbox"
│   └── PurchaseOrders.tsx                  # Add tab for linked requests
└── contexts/
    └── AppDataContext.tsx                  # Add newProductRequests state
```

---

## Permission Matrix

| Action | Brand Operator | Manufacturer | Founder Admin | Distributor |
|--------|---------------|--------------|---------------|-------------|
| Create request | ✅ | ❌ | ✅ | ❌ |
| Edit own draft | ✅ | ❌ | ✅ | ❌ |
| Submit request | ✅ | ❌ | ✅ | ❌ |
| Cancel request | ✅ | ❌ | ✅ | ❌ |
| View all requests | ✅ | View assigned only | ✅ | ❌ |
| Submit proposal | ❌ | ✅ | ❌ | ❌ |
| Approve proposal | ✅ | ❌ | ✅ | ❌ |
| Reject proposal | ✅ | ❌ | ✅ | ❌ |
| Create PO from approval | ✅ | ❌ | ✅ | ❌ |

---

## Migration Path

### Phase 1: Foundation (Week 1)
1. Create `NewProductRequest` data model
2. Build Brand Operator list + create form
3. Add sidebar navigation

### Phase 2: Manufacturer Portal (Week 2)
1. Build manufacturer inbox view
2. Create proposal submission form
3. Add notification badges

### Phase 3: Approval Flow (Week 3)
1. Build approval/rejection UI
2. Auto-create PO on approval
3. Link NPR to PO (foreign key)

### Phase 4: Polish (Week 4)
1. Sample shipment integration
2. Timeline visualization
3. Email notifications

---

## Open Questions

1. **Multiple manufacturers?** Currently hardcoded to Kirin. Do we need to support multiple co-packers?

2. **Sample approval gate?** Should there be a formal "sample approved" step between "proposal" and "production PO"?

3. **SKU generation timing?**
   - Option A: Create SKU immediately on approval (pre-production)
   - Option B: Create SKU when first batch ships (post-production)
   - Option C: Create SKU when manufacturer confirms production start

4. **Formula IP protection?** Should manufacturers see full flavor recipes, or just "hazelnut, vanilla" descriptors?

5. **Pricing negotiation?** Should there be back-and-forth on costing, or single proposal?

---

## Success Metrics

- Time from idea to production PO: Target < 30 days
- Manufacturer response time: Target < 5 business days
- Approval rate: Target > 70% of submitted requests
- Revision cycles: Target < 2 rounds per product

