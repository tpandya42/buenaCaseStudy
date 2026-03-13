"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MapPin } from "lucide-react";
import { useBulkCreateBuildings } from "@/hooks/use-properties";
import type { Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function BuildingsTab({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const bulkCreate = useBulkCreateBuildings(property.id);
  const buildings = property.buildings ?? [];

  const handleAdd = async () => {
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    try {
      await bulkCreate.mutateAsync([
        { label, street, houseNumber, zipCode, city },
      ]);
      toast.success("Building added!");
      setOpen(false);
      setLabel("");
      setStreet("");
      setHouseNumber("");
      setZipCode("");
      setCity("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add building"
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold">Buildings</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="shadow-sm">
              <Plus className="h-4 w-4 mr-1" /> Add Building
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Building</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Label *</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Building A"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Street</Label>
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>House No.</Label>
                  <Input
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zip Code</Label>
                  <Input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleAdd}
                disabled={bulkCreate.isPending}
                className="w-full"
              >
                {bulkCreate.isPending ? "Adding..." : "Add Building"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {buildings.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No buildings yet. Add your first building to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {buildings.map((b) => (
            <Card key={b.id} className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">
                  {b.label || "Unnamed"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {b.street} {b.houseNumber}, {b.zipCode} {b.city}
                </p>
                <p className="text-xs font-medium">
                  {b._count?.units ?? 0} units
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
