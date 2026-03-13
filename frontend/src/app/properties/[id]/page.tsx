"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useProperty } from "@/hooks/use-properties";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewTab } from "./_components/overview-tab";
import { BuildingsTab } from "./_components/buildings-tab";
import { UnitsTab } from "./_components/units-tab";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-accent/40 text-foreground border-accent",
  IN_REVIEW: "bg-primary/5 text-foreground/70 border-primary/10",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: property, isLoading, error } = useProperty(id);

  if (isLoading) {
    return (
      <div className="p-8 lg:p-10 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full mt-4" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="p-8 lg:p-10">
        <p className="text-destructive text-sm">
          Failed to load property: {error?.message || "Not found"}
        </p>
        <Link href="/properties">
          <Button variant="outline" className="mt-4">
            Back to Properties
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/properties">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight truncate">
              {property.name}
            </h1>
            <Badge
              variant="outline"
              className={`text-[10px] font-bold shrink-0 ${statusStyles[property.status] || ""}`}
            >
              {property.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {property.managementType} ·{" "}
            {property.propertyNumber || "No number"}
            {property.street &&
              ` · ${property.street} ${property.houseNumber}, ${property.zipCode} ${property.city}`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="buildings">
            Buildings ({property.buildings?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="units">
            Units ({property.units?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <OverviewTab property={property} />
        </TabsContent>
        <TabsContent value="buildings" className="mt-6">
          <BuildingsTab property={property} />
        </TabsContent>
        <TabsContent value="units" className="mt-6">
          <UnitsTab property={property} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
