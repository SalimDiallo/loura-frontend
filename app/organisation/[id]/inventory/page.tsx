"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/lib/hooks/core";
import { cn } from "@/lib/utils";
import {
    Box,
    DollarSign,
    Receipt,
    ShoppingCart,
    TrendingUp,
} from "lucide-react";
import { useParams } from "next/navigation";

// Charts directly from recharts
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

const MOCK_STATS = [
  {
    label: "Chiffre d'affaires",
    value: "12 450 000 GNF",
    icon: DollarSign,
  },
  {
    label: "Commandes",
    value: "284",
    icon: ShoppingCart,
  },
  {
    label: "Produits",
    value: "1 203",
    icon: Box,
  },
];

const MOCK_RECENT_ACTIVITY = [
  { id: 1, action: "Vente enregistrée", detail: "Facture #FAC-2026-047", time: "Il y a 12 min" },
  { id: 2, action: "Stock mis à jour", detail: "Riz local — +50 unités", time: "Il y a 1h" },
  { id: 3, action: "Nouvel employé", detail: "Amadou Diallo ajouté", time: "Il y a 3h" },
];

// Données formatées pour recharts
const REVENUE_DATA = [
  { month: "Jan", value: 2200000 },
  { month: "Fév", value: 2850000 },
  { month: "Mar", value: 2490000 },
  { month: "Avr", value: 3100000 },
  { month: "Mai", value: 1970000 },
  { month: "Juin", value: 2450000 },
];

const ORDERS_DATA = [
  { month: "Jan", value: 42 },
  { month: "Fév", value: 61 },
  { month: "Mar", value: 52 },
  { month: "Avr", value: 64 },
  { month: "Mai", value: 55 },
  { month: "Juin", value: 58 },
];

const PRODUCTS_DATA = [
  { name: "Riz local", value: 340 },
  { name: "Sucre", value: 210 },
  { name: "Sel", value: 295 },
  { name: "Huile", value: 150 },
  { name: "Farine", value: 110 },
  { name: "Boisson", value: 87 },
  { name: "Pâte alimentaire", value: 66 },
];

export default function InventoryPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { data: org, isLoading } = useOrganization(orgId);

  if (isLoading) {
    return (
      <div className="container p-8 mx-auto  space-y-6 w-full">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const orgName = org?.name || "Organisation";

  return (
    <div className="container p-8 mx-auto space-y-8 w-full">
      {/* Header */}
      <div className="flex items-center gap-5 w-full">
        <div
          className="h-12 w-12 bg-primary flex items-center justify-center text-white font-bold text-lg"
        >
          {orgName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{orgName}</h1>
          <div className="text-sm text-muted-foreground">Inventaire — Tableau de bord</div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        {MOCK_STATS.map((stat) => (
          <Card key={stat.label} className={cn("w-full")}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("flex items-center justify-center h-10 w-10 bg-muted rounded-full")}>
                <stat.icon className={cn("h-5 w-5 text-muted-foreground")} />
              </div>
              <div>
                <div className={cn("text-lg font-bold text-foreground")}>{stat.value}</div>
                <div className={cn("text-xs text-muted-foreground")}>{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grille principale des graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* LineChart for revenue */}
        <Card className={cn("w-full bg-white flex flex-col min-h-[340px]")}>
          <CardHeader className="pb-0">
            <CardTitle>
              <div className={cn("font-semibold text-base mb-4 flex items-center gap-2")}>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                Chiffre d'affaires (6 derniers mois)
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-0 flex-1 flex flex-col">
            <div className="relative h-56 w-full p-6 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={REVENUE_DATA}
                  margin={{ top: 8, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={v => v?.toLocaleString()}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    formatter={v => v?.toLocaleString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Chiffre d'affaires"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ r: 3 }}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        {/* BarChart for orders */}
        <Card className={cn("w-full flex flex-col min-h-[340px]")}>
          <CardHeader className="pb-0">
            <CardTitle>
              <div className={cn("font-semibold text-base mb-4 flex items-center gap-2")}>
                <ShoppingCart className="h-5 w-5 text-muted-foreground" /> Commandes / mois
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-0 flex-1 flex flex-col">
            <div className="relative h-56 w-full p-6 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ORDERS_DATA} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={v => v?.toLocaleString()}
                  />
                  <Bar
                    dataKey="value"
                    name="Commandes"
                    barSize={32}
                    maxBarSize={40}
                    isAnimationActive
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Horizontal BarChart for products */}
        <Card className={cn("bg-background border flex flex-col min-h-[340px]")}>
          <CardHeader className="pb-0">
            <CardTitle>
              <div className={cn("font-semibold text-base mb-4 flex items-center gap-2")}>
                <Box className="h-5 w-5 text-muted-foreground" /> Stock par produit
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-0 flex-1 flex flex-col">
            <div className="relative h-56 w-full p-6 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={PRODUCTS_DATA}
                  margin={{ top: 8, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 13 }}
                    width={100}
                  />
                  <Tooltip
                    formatter={v => v?.toLocaleString()}
                  />
                  <Bar
                    dataKey="value"
                    name="Stock"
                    barSize={20}
                    isAnimationActive
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        {/* Recent Activity */}
        <Card className={cn("bg-background border flex flex-col justify-between min-h-[340px]")}>
          <CardHeader className="pb-0">
            <CardTitle>
              <div className={cn("font-semibold text-base mb-4 flex items-center gap-2")}>
                <TrendingUp className="h-5 w-5 text-muted-foreground" /> Activité récente
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-0 flex-1 flex flex-col">
            <div className={cn("divide-y border bg-background")}>
              {MOCK_RECENT_ACTIVITY.map((item) => (
                <div key={item.id} className={cn("p-3 flex items-center justify-between")}>
                  <div>
                    <div className={cn("text-[15px] font-medium")}>{item.action}</div>
                    <div className={cn("text-xs text-muted-foreground")}>{item.detail}</div>
                  </div>
                  <span className={cn("text-xs text-muted-foreground")}>{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-end">
        {[
          { label: "Nouvelle vente", icon: ShoppingCart },
          { label: "Ajouter produit", icon: Box },
          { label: "Créer facture", icon: Receipt },
          { label: "Voir rapports", icon: TrendingUp },
        ].map((action) => (
          <button
            key={action.label}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 border bg-background text-sm hover:bg-muted transition shadow"
            )}
            type="button"
          >
            <action.icon className={cn("h-5 w-5 text-muted-foreground")} />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}