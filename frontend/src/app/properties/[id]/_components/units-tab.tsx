"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useBulkCreatePropertyUnits } from "@/hooks/use-properties";
import { useDeleteUnit } from "@/hooks/use-units";
import type { Property, CreateUnitPayload } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function UnitsTab({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [type, setType] = useState<
    "APARTMENT" | "OFFICE" | "GARDEN" | "PARKING"
  >("APARTMENT");
  const [buildingId, setBuildingId] = useState("");
  const [floor, setFloor] = useState("");
  const [sizeSqm, setSizeSqm] = useState("");
  const bulkCreate = useBulkCreatePropertyUnits(property.id);
  const deleteUnit = useDeleteUnit();
  const units = property.units ?? [];
  const buildings = property.buildings ?? [];

  const handleAdd = async () => {
    if (!number.trim()) {
      toast.error("Unit number is required");
      return;
    }
    if (!buildingId) {
      toast.error("Building is required");
      return;
    }
    try {
      const payload: CreateUnitPayload = {
        number,
        type,
        buildingId,
        floor: floor || undefined,
        sizeSqm: sizeSqm ? parseFloat(sizeSqm) : undefined,
      };
      await bulkCreate.mutateAsync([payload]);
      toast.success("Unit added!");
      setOpen(false);
      setNumber("");
      setFloor("");
      setSizeSqm("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add unit"
      );
    }
  };

  const handleDelete = async (unitId: string) => {
    try {
      await deleteUnit.mutateAsync(unitId);
      toast.success("Unit deleted");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete"
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold">Units</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={buildings.length === 0} className="shadow-sm">
              <Plus className="h-4 w-4 mr-1" /> Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Unit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Number *</Label>
                <Input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="e.g. W01"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as typeof type)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APARTMENT">Apartment</SelectItem>
                    <SelectItem value="OFFICE">Office</SelectItem>
                    <SelectItem value="GARDEN">Garden</SelectItem>
                    <SelectItem value="PARKING">Parking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Building *</Label>
                <Select value={buildingId} onValueChange={setBuildingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.label || b.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Input
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size (sqm)</Label>
                  <Input
                    type="number"
                    value={sizeSqm}
                    onChange={(e) => setSizeSqm(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleAdd}
                disabled={bulkCreate.isPending}
                className="w-full"
              >
                {bulkCreate.isPending ? "Adding..." : "Add Unit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {units.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            {buildings.length === 0
              ? "Add a building first before adding units."
              : "No units yet. Add your first unit to get started."}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Number</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Type</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Floor</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Size (sqm)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Co-ownership</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm">{u.number}</TableCell>
                  <TableCell className="text-sm">{u.type}</TableCell>
                  <TableCell className="text-sm">{u.floor || "—"}</TableCell>
                  <TableCell className="text-sm">{u.sizeSqm ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {u.coOwnershipShare != null
                      ? `${u.coOwnershipShare}%`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(u.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
