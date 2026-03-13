import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DocumentsPage() {
  return (
    <div className="p-8 lg:p-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Archive
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Uploaded documents and their processing status
        </p>
      </div>
      <Card className="border-border/50">
        <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold mb-1">No documents yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Documents are created when you use the AI Extract feature.
              Upload a PDF on the AI Extract page to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
