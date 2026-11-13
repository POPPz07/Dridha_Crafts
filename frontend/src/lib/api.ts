import { createClient } from "@/lib/supabase";

/**
 * Resolve the target API URL based on runtime environment:
 * 1. Server-side in Vercel function: reads bound service URL (process.env.BACKEND_URL).
 * 2. Explicit public URL: reads process.env.NEXT_PUBLIC_API_URL if configured.
 * 3. Client-side in browser: uses same-origin relative path (/api/...) routed by Vercel rewrites.
 * 4. Local SSR fallback: defaults to http://localhost:8000.
 */
function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // 1. Server-side in Vercel function runtime via service binding
  if (typeof window === "undefined" && process.env.BACKEND_URL) {
    const base = process.env.BACKEND_URL.replace(/\/$/, "");
    return `${base}${cleanEndpoint}`;
  }

  // 2. Explicit public API URL override
  if (process.env.NEXT_PUBLIC_API_URL) {
    const base = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    return `${base}${cleanEndpoint}`;
  }

  // 3. Client-side browser: relative path on same domain
  if (typeof window !== "undefined") {
    return cleanEndpoint;
  }

  // 4. Local SSR development fallback
  return `http://localhost:8000${cleanEndpoint}`;
}

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...fetchOptions } = options;

  let resolvedToken = token;
  if (!resolvedToken && typeof window !== "undefined") {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        resolvedToken = session.access_token;
      }
    } catch {
      // If Supabase client is unconfigured or in SSR, continue without token
    }
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (resolvedToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${resolvedToken}`;
  }

  const url = getApiUrl(endpoint);
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, data);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "DELETE" }),
};

export { ApiError };
