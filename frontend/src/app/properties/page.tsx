"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { AlertTriangle, Building2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useProperties, useProperty } from "@/hooks/use-properties";
import type {
  ListPropertiesQuery,
  Property,
  PropertySortBy,
  SortOrder,
  WarningPayload,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-accent/40 text-foreground border-accent",
  IN_REVIEW: "bg-primary/5 text-foreground/70 border-primary/10",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

const sortLabels: Record<PropertySortBy, string> = {
  createdAt: "Created date",
  updatedAt: "Updated date",
  name: "Name",
};

export default function PropertiesPage() {
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<PropertySortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const query = useMemo<ListPropertiesQuery>(
    () => ({
      source: "AI_ASSISTED",
      sortBy,
      sortOrder,
    }),
    [sortBy, sortOrder]
  );

  const { data: properties, isLoading, error } = useProperties(query);

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Portfolio
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">Extracted Deals</h1>
          <p className="text-sm text-muted-foreground mt-2">
            AI-assisted properties sorted by newest extraction, with expandable deal depth.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as PropertySortBy)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Sort field" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/properties/new">
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" /> Add Property
            </Button>
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
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
              <p className="font-semibold mb-1">No extracted deals yet</p>
              <p className="text-sm text-muted-foreground">
                Run AI extraction from the Extract page to generate your first deal.
              </p>
            </div>
            <Link href="/properties/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Create Manual Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {properties && properties.length > 0 && (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12" />
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  Deal
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  Type
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  Buildings
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  Units
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => {
                const isExpanded = expandedPropertyId === property.id;
                return (
                  <Fragment key={property.id}>
                    <TableRow
                      className={isExpanded ? "bg-muted/20 hover:bg-muted/20" : ""}
                    >
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() =>
                            setExpandedPropertyId((prev) =>
                              prev === property.id ? null : property.id
                            )
                          }
                          aria-label={
                            isExpanded
                              ? `Collapse ${property.name}`
                              : `Expand ${property.name}`
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Link
                            href={`/properties/${property.id}`}
                            className="font-semibold hover:underline"
                          >
                            {property.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {property.propertyNumber || "No number"} · {property.street || "No street"}{" "}
                            {property.houseNumber || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${statusStyles[property.status] || ""}`}
                        >
                          {property.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{property.managementType}</TableCell>
                      <TableCell className="text-sm">
                        {property._count?.buildings ?? 0}
                      </TableCell>
                      <TableCell className="text-sm">{property._count?.units ?? 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(property.createdAt)}
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0 whitespace-normal">
                          <ExpandedDealDetails
                            propertyId={property.id}
                            fallbackProperty={property}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ExpandedDealDetails({
  propertyId,
  fallbackProperty,
}: {
  propertyId: string;
  fallbackProperty: Property;
}) {
  const { data, isLoading, error } = useProperty(propertyId, { enabled: true });
  const property = data ?? fallbackProperty;
  const latestJob = property.aiExtractionJobs?.[0];
  const units = property.units ?? [];
  const buildings = property.buildings ?? [];
  const coOwnershipTotal = units.reduce(
    (sum, unit) => sum + (unit.coOwnershipShare ?? 0),
    0
  );
  const hasCoOwnershipRisk =
    property.managementType === "WEG" &&
    units.length > 0 &&
    Math.abs(coOwnershipTotal - 1000) > 50;
  const warnings = uniqueWarnings([
    ...getWarnings(property.aiMeta),
    ...getWarnings(latestJob?.validationIssues),
  ]);

  if (isLoading && !data) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/20 border-t">
      {error && (
        <p className="text-destructive text-sm mb-4">
          Could not load full deal details: {error.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="outline" className="text-[10px] font-bold">
          Source: {property.source}
        </Badge>
        <Badge variant="outline" className="text-[10px] font-bold">
          Buildings: {buildings.length}
        </Badge>
        <Badge variant="outline" className="text-[10px] font-bold">
          Units: {units.length}
        </Badge>
        <Badge
          variant="outline"
          className={`text-[10px] font-bold ${hasCoOwnershipRisk ? "border-amber-400 text-amber-700" : ""}`}
        >
          Co-ownership sum: {coOwnershipTotal.toFixed(1)}‰
        </Badge>
        <span className="text-xs text-muted-foreground">
          Latest extraction:{" "}
          {formatDate(latestJob?.completedAt ?? latestJob?.createdAt ?? property.createdAt)}
        </span>
      </div>

      {warnings.length > 0 && (
        <Card className="mb-4 border-amber-200 bg-amber-50/70">
          <CardContent className="pt-4 text-sm text-amber-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Extraction warnings
            </div>
            <ul className="list-disc pl-5 space-y-1">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <h4 className="text-sm font-bold mb-3">Buildings</h4>
            {buildings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No buildings extracted.</p>
            ) : (
              <div className="space-y-2">
                {buildings.map((building) => (
                  <div
                    key={building.id}
                    className="rounded-md border border-border/50 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">{building.label || "Unnamed building"}</p>
                    <p className="text-muted-foreground text-xs">
                      {[building.street, building.houseNumber, building.zipCode, building.city]
                        .filter(Boolean)
                        .join(" ") || "No address data"}
                    </p>
                    <p className="text-[11px] text-foreground/60 mt-1">
                      Units: {building._count?.units ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-4">
            <h4 className="text-sm font-bold mb-3">Units</h4>
            {units.length === 0 ? (
              <p className="text-sm text-muted-foreground">No units extracted.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="rounded-md border border-border/50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">
                        {unit.number} · {unit.type}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Share:{" "}
                        {unit.coOwnershipShare != null
                          ? `${unit.coOwnershipShare}‰`
                          : "—"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Building: {unit.building?.label || unit.buildingId} · Floor:{" "}
                      {unit.floor || "—"} · Size:{" "}
                      {unit.sizeSqm != null ? `${unit.sizeSqm} sqm` : "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getWarnings(payload?: WarningPayload | null) {
  if (!payload || !Array.isArray(payload.warnings)) {
    return [];
  }
  return payload.warnings.filter((warning): warning is string => typeof warning === "string");
}

function uniqueWarnings(warnings: string[]) {
  return Array.from(new Set(warnings));
}
