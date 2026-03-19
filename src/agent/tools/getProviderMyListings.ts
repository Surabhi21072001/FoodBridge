import { AxiosInstance } from "axios";

export interface GetProviderMyListingsArgs {
  status?: string;
  page?: number;
  limit?: number;
}

export async function getProviderMyListings(
  apiClient: AxiosInstance,
  args: GetProviderMyListingsArgs
) {
  const params = new URLSearchParams();
  if (args.status) params.append("status", args.status);
  if (args.page !== undefined) params.append("page", String(args.page));
  if (args.limit !== undefined) params.append("limit", String(args.limit));

  const query = params.toString();
  const response = await apiClient.get(
    `/listings/provider/my-listings${query ? `?${query}` : ""}`
  );

  return {
    success: true,
    data: response.data.data,
    pagination: response.data.pagination,
  };
}
