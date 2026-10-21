const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api/v1";

export async function getHealth(): Promise<{ status: string }> {
  const response = await fetch(apiBaseUrl + "/health");
  if (!response.ok) {
    throw new Error(`API health check failed: ${response.status}`);
  }
  return response.json() as Promise<{ status: string }>;
}
