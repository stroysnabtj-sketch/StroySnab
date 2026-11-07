export const PRODUCT_REQUEST_STATUSES = [
  "NEW",
  "IN_REVIEW",
  "AVAILABLE",
  "UNAVAILABLE",
  "CANCELLED",
] as const;

export type ProductRequestStatus = (typeof PRODUCT_REQUEST_STATUSES)[number];

export interface ProductRequestDTO {
  id: string;
  number: string;
  userId: string | null;
  productName: string;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  requiredDate: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  status: ProductRequestStatus;
  assignedTo: string | null;
  assignedToName: string | null;
  responseNote: string | null;
  estimatedPriceDirams: string | null;
  estimatedDeliveryDays: number | null;
  resolvedProductId: string | null;
  resolvedProductTitle: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProductRequestDTO {
  id: string;
  number: string;
  productName: string;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  requiredDate: string | null;
  status: ProductRequestStatus;
  responseNote: string | null;
  estimatedPriceDirams: string | null;
  estimatedDeliveryDays: number | null;
  resolvedProductId: string | null;
  resolvedProductTitle: string | null;
  resolvedProductSlug: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequestAuditEntry {
  id: string;
  action: string;
  actorRole: string | null;
  actorUserId: string | null;
  createdAt: string;
  data: Record<string, unknown> | null;
}

export interface ManagedProductRequestDetailDTO extends ProductRequestDTO {
  history: ProductRequestAuditEntry[];
}

export interface ListManagedRequestsQuery {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface ListManagedRequestsResponse {
  items: ProductRequestDTO[];
  total: number;
  page: number;
  pageSize: number;
  newCount: number;
}

export interface ListOwnRequestsQuery {
  page?: number;
  pageSize?: number;
}

export interface ListOwnRequestsResponse {
  items: CustomerProductRequestDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RespondProductRequestInput {
  status: "IN_REVIEW" | "AVAILABLE" | "UNAVAILABLE";
  responseNote?: string | null;
  estimatedPriceDirams?: string | null;
  estimatedDeliveryDays?: number | null;
  resolvedProductId?: string | null;
  assignedTo?: string | null;
  version: number;
}

