import { useState } from "react";
import { Building2, Award, Factory, Users, FileText, MapPin, Phone, Mail, Save, Edit3, Upload, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { toast } from "@/components/ui/sonner";

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "pending";
}

interface Equipment {
  id: string;
  name: string;
  capacity: string;
  status: "operational" | "maintenance" | "offline";
}

export default function ManufacturerProfilePage() {
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get manufacturer profile from AppData or use defaults
  const profile = data.manufacturerProfile || {
    companyName: "",
    legalName: "",
    address: {
      street: "",
      city: "",
      region: "",
      country: "",
      postalCode: "",
    },
    primaryContact: {
      name: "",
      role: "",
      email: "",
      phone: "",
    },
    backupContact: {
      name: "",
      role: "",
      email: "",
      phone: "",
    },
    productionCapacity: {
      monthlyCases: 0,
      peakCapacity: 0,
      currentUtilization: 0,
    },
    certifications: [] as Certification[],
    equipment: [] as Equipment[],
    taxId: "",
    website: "",
    description: "",
  };

  const [formData, setFormData] = useState(profile);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateData((d) => ({
        ...d,
        manufacturerProfile: formData,
      }));
      toast.success("Profile saved", { description: "Manufacturer profile updated successfully." });
      setIsEditing(false);
    } catch {
      toast.error("Failed to save", { description: "Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const addCertification = () => {
    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      name: "",
      issuer: "",
      issuedAt: "",
      expiresAt: "",
      status: "pending",
    };
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, newCert],
    }));
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  const removeCertification = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== id),
    }));
  };

  const addEquipment = () => {
    const newEquip: Equipment = {
      id: `equip-${Date.now()}`,
      name: "",
      capacity: "",
      status: "operational",
    };
    setFormData((prev) => ({
      ...prev,
      equipment: [...prev.equipment, newEquip],
    }));
  };

  const updateEquipment = (id: string, field: keyof Equipment, value: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
  };

  const removeEquipment = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((e) => e.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manufacturer Profile"
        description="Company details, certifications, production capacity, and compliance documentation."
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Factory className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">
              {formData.companyName || "Your Distillery"}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={isSaving}
        >
          {isEditing ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </>
          ) : (
            <>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Company Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="e.g., Tokyo Craft Spirits Co."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name</Label>
                <Input
                  id="legalName"
                  value={formData.legalName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, legalName: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Registered legal entity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / VAT</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, taxId: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Tax identification number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Company Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                disabled={!isEditing}
                placeholder="Brief description of your distillery and specialties"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value },
                    }))
                  }
                  disabled={!isEditing}
                  placeholder="Street address"
                />
                <Input
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value },
                    }))
                  }
                  disabled={!isEditing}
                  placeholder="City"
                />
                <Input
                  value={formData.address.region}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, region: e.target.value },
                    }))
                  }
                  disabled={!isEditing}
                  placeholder="State/Region"
                />
                <Input
                  value={formData.address.postalCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, postalCode: e.target.value },
                    }))
                  }
                  disabled={!isEditing}
                  placeholder="Postal Code"
                />
                <Input
                  value={formData.address.country}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, country: e.target.value },
                    }))
                  }
                  disabled={!isEditing}
                  placeholder="Country"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Capacity */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Factory className="h-4 w-4" />
              Production Capacity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Monthly Capacity (cases)</Label>
              <Input
                type="number"
                value={formData.productionCapacity.monthlyCases || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    productionCapacity: {
                      ...prev.productionCapacity,
                      monthlyCases: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Peak Capacity (cases)</Label>
              <Input
                type="number"
                value={formData.productionCapacity.peakCapacity || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    productionCapacity: {
                      ...prev.productionCapacity,
                      peakCapacity: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Current Utilization (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.productionCapacity.currentUtilization || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    productionCapacity: {
                      ...prev.productionCapacity,
                      currentUtilization: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                disabled={!isEditing}
              />
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                Utilization affects Hajime's production request planning. Update monthly or when capacity changes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="mb-3 text-sm font-medium">Primary Contact</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.primaryContact.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, name: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={formData.primaryContact.role}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, role: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="e.g., Production Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.primaryContact.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, email: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="email@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Phone
                  </Label>
                  <Input
                    value={formData.primaryContact.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, phone: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="mb-3 text-sm font-medium">Backup Contact</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.backupContact.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        backupContact: { ...prev.backupContact, name: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={formData.backupContact.role}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        backupContact: { ...prev.backupContact, role: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="e.g., Operations Director"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.backupContact.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        backupContact: { ...prev.backupContact, email: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="email@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Phone
                  </Label>
                  <Input
                    value={formData.backupContact.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        backupContact: { ...prev.backupContact, phone: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Factory className="h-4 w-4" />
              Equipment
            </CardTitle>
            {isEditing && (
              <Button type="button" size="sm" variant="outline" onClick={addEquipment}>
                + Add
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground">No equipment listed.</p>
            ) : (
              formData.equipment.map((equip) => (
                <div key={equip.id} className="rounded-lg border p-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={equip.name}
                        onChange={(e) => updateEquipment(equip.id, "name", e.target.value)}
                        placeholder="Equipment name"
                        className="text-sm"
                      />
                      <Input
                        value={equip.capacity}
                        onChange={(e) => updateEquipment(equip.id, "capacity", e.target.value)}
                        placeholder="Capacity (e.g., 500L still)"
                        className="text-sm"
                      />
                      <select
                        value={equip.status}
                        onChange={(e) => updateEquipment(equip.id, "status", e.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="operational">Operational</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="offline">Offline</option>
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeEquipment(equip.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{equip.name}</span>
                        <Badge
                          variant={
                            equip.status === "operational"
                              ? "default"
                              : equip.status === "maintenance"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {equip.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{equip.capacity}</p>
                    </>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              Certifications & Compliance
            </CardTitle>
            {isEditing && (
              <Button type="button" size="sm" variant="outline" onClick={addCertification}>
                + Add Certification
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {formData.certifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
                <Award className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No certifications added yet</p>
                <p className="text-xs text-muted-foreground">
                  Add organic, quality, safety, and export certifications.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {formData.certifications.map((cert) => (
                  <div key={cert.id} className="card-interactive p-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={cert.name}
                          onChange={(e) => updateCertification(cert.id, "name", e.target.value)}
                          placeholder="Certification name"
                          className="text-sm"
                        />
                        <Input
                          value={cert.issuer}
                          onChange={(e) => updateCertification(cert.id, "issuer", e.target.value)}
                          placeholder="Issuing body"
                          className="text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px]">Issued</Label>
                            <Input
                              type="date"
                              value={cert.issuedAt}
                              onChange={(e) => updateCertification(cert.id, "issuedAt", e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Expires</Label>
                            <Input
                              type="date"
                              value={cert.expiresAt}
                              onChange={(e) => updateCertification(cert.id, "expiresAt", e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <select
                          value={cert.status}
                          onChange={(e) => updateCertification(cert.id, "status", e.target.value as "active" | "pending" | "expired")}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="expired">Expired</option>
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeCertification(cert.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <p className="font-medium">{cert.name}</p>
                            <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                          </div>
                          <Badge
                            variant={
                              cert.status === "active"
                                ? "default"
                                : cert.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {cert.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Issued: {cert.issuedAt || "—"}</span>
                          <span>Expires: {cert.expiresAt || "—"}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Documents & Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-6">
              <div className="flex flex-col items-center justify-center text-center">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Document Upload</p>
                <p className="text-xs text-muted-foreground">
                  Upload distilling licenses, export permits, insurance certificates, and quality certifications.
                </p>
                {isEditing && (
                  <Button type="button" size="sm" variant="outline" className="mt-3">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </Button>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">
                  PDF, PNG, JPG up to 10MB each
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-muted p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  All documents are reviewed by Hajime's compliance team. Ensure certifications are current
                  and match your production capacity declarations. Expired licenses may result in order holds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
