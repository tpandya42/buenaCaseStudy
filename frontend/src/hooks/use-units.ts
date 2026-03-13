import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Unit,
  CreateUnitPayload,
  UpdateUnitPayload,
  BulkUpdateUnitItem,
} from "@/lib/types";

export function useUnits(propertyId?: string) {
  return useQuery<Unit[]>({
    queryKey: ["units", { propertyId }],
    queryFn: () =>
      api.get("/units", { params: { propertyId } }).then((r) => r.data),
    enabled: !!propertyId,
  });
}

export function useUnit(id: string) {
  return useQuery<Unit>({
    queryKey: ["units", id],
    queryFn: () => api.get(`/units/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useBulkCreateUnits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { propertyId: string; units: CreateUnitPayload[] }) =>
      api
        .post(`/properties/${data.propertyId}/units/bulk`, {
          units: data.units,
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });
}

export function useBulkUpdateUnits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (units: BulkUpdateUnitItem[]) =>
      api.patch("/units/bulk", { units }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });
}

export function useUpdateUnit(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUnitPayload) =>
      api.patch(`/units/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units"] });
      qc.invalidateQueries({ queryKey: ["units", id] });
    },
  });
}

export function useDeleteUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/units/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });
}
