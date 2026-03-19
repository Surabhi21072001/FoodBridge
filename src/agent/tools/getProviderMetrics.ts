import { AxiosInstance } from "axios";

export async function getProviderMetrics(apiClient: AxiosInstance) {
  const response = await apiClient.get("/metrics/provider");
  return { success: true, data: response.data.data };
}
