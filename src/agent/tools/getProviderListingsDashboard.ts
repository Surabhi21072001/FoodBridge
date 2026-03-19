import { AxiosInstance } from "axios";

export interface ProviderListingsDashboardArgs {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export async function getProviderListingsDashboard(
  apiClient: AxiosInstance,
  args: ProviderListingsDashboardArgs
) {
  const params = new URLSearchParams();
  if (args.status) params.append("status", args.status);
  if (args.category) params.append("category", args.category);
  if (args.page !== undefined) params.append("page", String(args.page));
  if (args.limit !== undefined) params.append("limit", String(args.limit));

  const query = params.toString();
  const response = await apiClient.get(
    `/listings/provider/dashboard${query ? `?${query}` : ""}`
  );

  return {
    success: true,
    data: response.data.data,
    summary: response.data.summary,
    pagination: response.data.pagination,
  };
}
