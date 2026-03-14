"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useExtractDocument } from "@/hooks/use-extraction";
import { useProperties } from "@/hooks/use-properties";
import type { ExtractionResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function ExtractPage() {
  const extract = useExtractDocument();
  const { data: properties, isLoading, error } = useProperties();
  const [propertyId, setPropertyId] = useState<string>("");
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      if (!propertyId) {
        toast.error("Please select a property first");
        return;
      }
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are supported");
        return;
      }
      try {
        const data = await extract.mutateAsync({ file, propertyId });
        setResult(data);
        toast.success("Extraction complete!");
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Extraction failed"
        );
      }
    },
    [extract, propertyId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: extract.isPending || !propertyId,
  });

  return (
    <div className="p-8 lg:p-10 max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Document Intelligence
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Extract</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Upload a PDF document to extract property data using AI
        </p>
      </div>

      <Card className="mb-6 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Select property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Property *</Label>
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading properties…</p>
          )}
          {error && (
            <p className="text-sm text-destructive">
              Failed to load properties: {error.message}
            </p>
          )}
          {!isLoading && properties && properties.length > 0 && (
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name} ({property.propertyNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!isLoading && properties?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No properties yet.{" "}
              <Link href="/properties/new" className="text-primary underline">
                Create a property
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8 border-border/50">
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/20 hover:border-primary/40 hover:bg-accent/10"
            } ${extract.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            {extract.isPending ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Extracting data from PDF...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Upload className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-semibold">
                  Drop a PDF here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports declaration of division documents
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">Extraction Results</h2>
            <Badge variant="outline" className="text-[10px] font-bold">
              Confidence: {(result.confidence * 100).toFixed(0)}%
            </Badge>
          </div>

          {result.warning && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-4 text-sm text-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {result.warning}
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">
                Buildings ({result.buildings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.buildings.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No buildings extracted
                </p>
              ) : (
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest">Label</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest">Street</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest">House Number</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.buildings.map((b, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">
                            {b.label}
                          </TableCell>
                          <TableCell className="text-sm">{b.street || "—"}</TableCell>
                          <TableCell className="text-sm">{b.houseNumber || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">
                Units ({result.units.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.units.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No units extracted
                </p>
              ) : (
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest">Number</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest">Type</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest">Building</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest">Floor</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest">Size (sqm)</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest">Co-ownership %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.units.map((u, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">
                            {u.number}
                          </TableCell>
                          <TableCell className="text-sm">{u.type}</TableCell>
                          <TableCell className="text-sm">{u.buildingLabel}</TableCell>
                          <TableCell className="text-sm">{u.floor || "—"}</TableCell>
                          <TableCell className="text-sm">{u.sizeSqm ?? "—"}</TableCell>
                          <TableCell className="text-sm">{u.coOwnershipShare ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
