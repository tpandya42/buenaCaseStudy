import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ExtractionResult } from "@/lib/types";

export function useExtractDocument() {
  return useMutation<ExtractionResult, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/ai-extraction/start", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
  });
}
