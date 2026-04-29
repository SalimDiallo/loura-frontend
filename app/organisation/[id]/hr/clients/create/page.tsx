"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useCreateCustomer } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type { CreateCustomerData, CustomerType } from "@/lib/types";
import {
    Building,
    DollarSign,
    FileText,
    Hash,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    User,
    UserCheck,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export default function CreateClientPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.CUSTOMERS.MANAGE}>
            <CreateClientPage />
        </PermissionGuard>
    );
}

function CreateClientPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { formatCurrency } = useCurrencyFormatter();

    const [formData, setFormData] = useState<CreateCustomerData>({
        customer_type: "individual",
        name: "",
        code: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        tax_id: "",
        credit_limit: "0",
        payment_terms_days: 0,
        notes: "",
        is_active: true,
    });

    const createCustomer = useCreateCustomer();

    const handleActiveSwitch = useCallback((checked: boolean) => {
        setFormData((prev) => ({ ...prev, is_active: checked }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast("Champ manquant", {
                description: "Le nom est obligatoire.",
            });
            return;
        }
        try {
            await createCustomer.mutateAsync({ orgId, data: formData });
            toast.success("Client créé avec succès.");
            router.push(`/organisation/${orgId}/hr/clients`);
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.name?.[0] ||
                    error?.data?.code?.[0] ||
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible de créer le client",
            });
        }
    };

    const isCompany = formData.customer_type === "company";
    const creditLimit = Number(formData.credit_limit || 0);

    return (
        <FormPageLayout
            title="Nouveau client"
            subtitle="Ajoutez un client à votre portefeuille"
            backLink={`/organisation/${orgId}/hr/clients`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle>Aperçu</CardTitle>
                        <CardDescription>Résumé du client</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Identité</p>
                            <p className="text-sm text-primary font-medium flex items-center gap-2">
                                {isCompany ? (
                                    <Building className="h-4 w-4" />
                                ) : (
                                    <User className="h-4 w-4" />
                                )}
                                {formData.name || "Nouveau client"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isCompany ? "Entreprise" : "Particulier"}
                                {formData.code ? ` · ${formData.code}` : ""}
                            </p>
                        </div>
                        {(formData.city || formData.country) && (
                            <div className="space-y-2 pt-4 border-t">
                                <p className="text-sm font-medium">Localisation</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {[formData.city, formData.country]
                                        .filter(Boolean)
                                        .join(", ") || "—"}
                                </p>
                            </div>
                        )}
                        <div className="space-y-2 pt-4 border-t">
                            <p className="text-sm font-medium">Conditions</p>
                            {creditLimit > 0 ? (
                                <>
                                    <p className="text-sm">
                                        Crédit autorisé :{" "}
                                        <span className="font-semibold">
                                            {formatCurrency(creditLimit)}
                                        </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Délai : {formData.payment_terms_days ?? 0} jours
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Ventes au comptant uniquement
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Informations client</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Type de client */}
                        <div className="space-y-2">
                            <Label>Type de client *</Label>
                            <div className="grid gap-3 md:grid-cols-2">
                                {[
                                    {
                                        value: "individual" as CustomerType,
                                        label: "Particulier",
                                        icon: User,
                                        description: "Client personne physique",
                                    },
                                    {
                                        value: "company" as CustomerType,
                                        label: "Entreprise",
                                        icon: Building,
                                        description: "Société, commerce, organisation",
                                    },
                                ].map((opt) => {
                                    const Icon = opt.icon;
                                    const selected = formData.customer_type === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    customer_type: opt.value,
                                                })
                                            }
                                            className={`p-4 border-2 rounded-md text-left transition-all ${
                                                selected
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                            }`}
                                        >
                                            <Icon className="h-5 w-5 mb-2" />
                                            <div className="font-semibold text-sm">
                                                {opt.label}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {opt.description}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">
                                    {isCompany ? "Raison sociale" : "Nom complet"} *
                                </Label>
                                <div className="relative">
                                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Code interne</Label>
                                <Input
                                    id="code"
                                    placeholder="CLI-001 (optionnel)"
                                    value={formData.code || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            code: e.target.value.toUpperCase(),
                                        })
                                    }
                                    maxLength={30}
                                />
                            </div>
                            {isCompany && (
                                <div className="space-y-2">
                                    <Label htmlFor="tax_id">NIF / TVA</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="tax_id"
                                            placeholder="Identifiant fiscal"
                                            value={formData.tax_id || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    tax_id: e.target.value,
                                                })
                                            }
                                            className="pl-10"
                                            maxLength={50}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contact */}
                        <div className="space-y-4 pt-4 border-t">
                            <p className="text-sm font-semibold">Contact</p>
                            <div className="grid gap-4 md:grid-cols-2">
                                {isCompany && (
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="contact_name">
                                            Nom du contact principal
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="contact_name"
                                                value={formData.contact_name || ""}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        contact_name: e.target.value,
                                                    })
                                                }
                                                className="pl-10"
                                                maxLength={150}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    email: e.target.value,
                                                })
                                            }
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            value={formData.phone || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    phone: e.target.value,
                                                })
                                            }
                                            className="pl-10"
                                            maxLength={30}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Adresse */}
                        <div className="space-y-4 pt-4 border-t">
                            <p className="text-sm font-semibold">Adresse</p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Adresse</Label>
                                    <Input
                                        id="address"
                                        value={formData.address || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                address: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">Ville</Label>
                                    <Input
                                        id="city"
                                        value={formData.city || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, city: e.target.value })
                                        }
                                        maxLength={100}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Pays</Label>
                                    <Input
                                        id="country"
                                        value={formData.country || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                country: e.target.value,
                                            })
                                        }
                                        maxLength={100}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Crédit */}
                        <div className="space-y-4 pt-4 border-t">
                            <p className="text-sm font-semibold">
                                Conditions commerciales
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Laissez le crédit à 0 pour des ventes au comptant uniquement.
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="credit_limit">Crédit maximum</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="credit_limit"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={String(formData.credit_limit ?? "0")}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    credit_limit: e.target.value,
                                                })
                                            }
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payment_terms_days">
                                        Délai de paiement (jours)
                                    </Label>
                                    <Input
                                        id="payment_terms_days"
                                        type="number"
                                        min="0"
                                        value={formData.payment_terms_days ?? 0}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                payment_terms_days:
                                                    parseInt(e.target.value || "0", 10) || 0,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="notes">Notes</Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <textarea
                                    id="notes"
                                    rows={3}
                                    value={formData.notes || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notes: e.target.value })
                                    }
                                    className="flex w-full border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10 rounded-md"
                                />
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-between border p-4 rounded-md">
                            <div className="space-y-0.5">
                                <Label className="text-base">Actif</Label>
                                <p className="text-sm text-muted-foreground">
                                    Un client inactif n'apparaît plus dans les sélections.
                                </p>
                            </div>
                            <Switch
                                checked={!!formData.is_active}
                                onCheckedChange={handleActiveSwitch}
                            />
                        </div>

                        <div className="flex gap-3 pt-4 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={createCustomer.isPending}
                                className="gap-2"
                            >
                                {createCustomer.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Créer le client
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
