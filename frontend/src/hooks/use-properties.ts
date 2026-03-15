import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Property,
  CreatePropertyPayload,
  UpdatePropertyPayload,
  CreateBuildingPayload,
  CreateUnitPayload,
  ListPropertiesQuery,
} from "@/lib/types";

export function useProperties(params?: ListPropertiesQuery) {
  const queryParams = params ?? {};

  return useQuery<Property[]>({
    queryKey: ["properties", queryParams],
    queryFn: () => api.get("/properties", { params: queryParams }).then((r) => r.data),
  });
}

export function useProperty(id: string, options?: { enabled?: boolean }) {
  return useQuery<Property>({
    queryKey: ["properties", id],
    queryFn: () => api.get(`/properties/${id}`).then((r) => r.data),
    enabled: options?.enabled ?? !!id,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePropertyPayload) =>
      api.post("/properties", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useUpdateProperty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePropertyPayload) =>
      api.patch(`/properties/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["properties", id] });
    },
  });
}

export function useFinalizeProperty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post(`/properties/${id}/finalize`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["properties", id] });
    },
  });
}

export function useBulkCreateBuildings(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (buildings: CreateBuildingPayload[]) =>
      api
        .post(`/properties/${propertyId}/buildings/bulk`, { items: buildings })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["properties", propertyId] });
    },
  });
}

export function useBulkCreatePropertyUnits(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (units: CreateUnitPayload[]) =>
      api
        .post(`/properties/${propertyId}/units/bulk`, { items: units })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["properties", propertyId] });
    },
  });
}
