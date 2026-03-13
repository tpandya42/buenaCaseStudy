"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useCreateProperty } from "@/hooks/use-properties";
import {
  createPropertySchema,
  type CreatePropertyFormData,
} from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_ORG_ID = "org_default";

export default function NewPropertyPage() {
  const router = useRouter();
  const createProperty = useCreateProperty();

  const form = useForm<CreatePropertyFormData>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: {
      name: "",
      managementType: "WEG",
      organizationId: DEFAULT_ORG_ID,
      street: "",
      houseNumber: "",
      zipCode: "",
      city: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const result = await createProperty.mutateAsync(data);
      toast.success("Property created!");
      router.push(`/properties/${result.id}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create property"
      );
    }
  });

  return (
    <div className="p-8 lg:p-10 max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Create
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          New Property
        </h1>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g. Berliner Str. 12"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Management Type *</Label>
              <Select
                value={form.watch("managementType")}
                onValueChange={(v) =>
                  form.setValue("managementType", v as "WEG" | "MV")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEG">WEG (Condominium)</SelectItem>
                  <SelectItem value="MV">MV (Rental)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street</Label>
                <Input id="street" {...form.register("street")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="houseNumber">House Number</Label>
                <Input id="houseNumber" {...form.register("houseNumber")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input id="zipCode" {...form.register("zipCode")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...form.register("city")} />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={createProperty.isPending}>
                {createProperty.isPending ? "Creating..." : "Create Property"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
