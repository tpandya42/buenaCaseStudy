"use client";

import Link from "next/link";
import { Plus, Building2, MapPin } from "lucide-react";
import { useProperties } from "@/hooks/use-properties";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-accent/40 text-foreground border-accent",
  IN_REVIEW: "bg-primary/5 text-foreground/70 border-primary/10",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

export default function PropertiesPage() {
  const { data: properties, isLoading, error } = useProperties();

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Portfolio
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Properties
          </h1>
        </div>
        <Link href="/properties/new">
          <Button className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Property
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/50">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">
              Failed to load properties: {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {properties && properties.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold mb-1">No properties yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first property to get started.
              </p>
            </div>
            <Link href="/properties/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Create Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {properties && properties.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`}>
              <Card className="group hover:shadow-md transition-all cursor-pointer h-full border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">
                      {p.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${statusStyles[p.status] || ""}`}
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {p.managementType} · {p.propertyNumber || "No number"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1.5">
                    {p.street && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {p.street} {p.houseNumber}, {p.zipCode} {p.city}
                      </p>
                    )}
                    <p className="text-xs font-medium text-foreground/50">
                      {p._count?.buildings ?? 0} buildings ·{" "}
                      {p._count?.units ?? 0} units
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
