"use client";

import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { useFinalizeProperty } from "@/hooks/use-properties";
import type { Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OverviewTab({ property }: { property: Property }) {
  const finalize = useFinalizeProperty(property.id);

  const handleFinalize = async () => {
    try {
      await finalize.mutateAsync();
      toast.success("Property finalized!");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to finalize"
      );
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Name" value={property.name} />
          <Row label="Type" value={property.managementType} />
          <Row label="Number" value={property.propertyNumber || "—"} />
          <Row label="Status" value={property.status} />
          <Row label="Source" value={property.source} />
          {property.aiConfidenceScore != null && (
            <Row
              label="AI Confidence"
              value={`${(property.aiConfidenceScore * 100).toFixed(0)}%`}
            />
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Street" value={property.street || "—"} />
          <Row label="House Number" value={property.houseNumber || "—"} />
          <Row label="Zip Code" value={property.zipCode || "—"} />
          <Row label="City" value={property.city || "—"} />
          <Row label="Country" value={property.country || "—"} />
        </CardContent>
      </Card>

      {property.status === "DRAFT" && (
        <Card className="md:col-span-2 border-accent">
          <CardContent className="pt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                This property is in draft. Finalize to move it to review.
              </p>
            </div>
            <Button
              onClick={handleFinalize}
              disabled={finalize.isPending}
              className="shrink-0"
            >
              {finalize.isPending ? "Finalizing..." : "Finalize Property"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
