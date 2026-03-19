import { AxiosInstance } from "axios";

export async function getProviderReservations(
  apiClient: AxiosInstance,
  args: { status?: string; date?: string; page?: number; limit?: number }
) {
  const params = new URLSearchParams();
  if (args.status) params.append("status", args.status);
  if (args.date) params.append("date", args.date);
  if (args.page !== undefined) params.append("page", String(args.page));
  if (args.limit !== undefined) params.append("limit", String(args.limit));

  const query = params.toString();
  const response = await apiClient.get(
    `/reservations/provider/all${query ? `?${query}` : ""}`
  );
  return { success: true, data: response.data.data, total: response.data.total };
}
