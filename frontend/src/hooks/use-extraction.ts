import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DocumentType, ExtractionResult } from "@/lib/types";

type ExtractPayload = {
  file: File;
  organizationId: string;
  documentType?: DocumentType;
};

export function useExtractDocument() {
  return useMutation<ExtractionResult, Error, ExtractPayload>({
    mutationFn: async ({ file, organizationId, documentType }) => {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("organizationId", organizationId);
      if (documentType) {
        formData.append("documentType", documentType);
      }
      const res = await api.post("/documents/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
  });
}
