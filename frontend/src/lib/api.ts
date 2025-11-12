const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface PrintRequest {
  id: number;
  wallet_address: string;
  asset_id: string;
  status: "pending" | "in_progress" | "completed" | "collected";
  tshirt_size: "S" | "M" | "L" | "XL";
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: number;
  is_paused: boolean;
  max_print_requests: number;
  current_count: number;
  created_at: string;
  updated_at: string;
}

export interface BoothStatus {
  is_paused: boolean;
  max_print_requests: number;
  current_count: number;
  available: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get admin token from localStorage
export const getAdminToken = (): string | null => {
  return localStorage.getItem("admin_token");
};

// Set admin token in localStorage
export const setAdminToken = (token: string): void => {
  localStorage.setItem("admin_token", token);
};

// Remove admin token from localStorage
export const removeAdminToken = (): void => {
  localStorage.removeItem("admin_token");
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

// Authenticated API request helper
async function authenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAdminToken();
  if (!token) {
    throw new Error("No admin token found");
  }

  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// Print Request APIs
export const printRequestApi = {
  // Create a new print request
  create: async (
    walletAddress: string,
    assetId: number,
    tshirtSize: "S" | "M" | "L" | "XL"
  ): Promise<PrintRequest> => {
    return apiRequest<PrintRequest>("/print-request", {
      method: "POST",
      body: JSON.stringify({
        wallet_address: walletAddress,
        asset_id: assetId,
        tshirt_size: tshirtSize,
      }),
    });
  },

  // Get booth status (public)
  getBoothStatus: async (): Promise<BoothStatus> => {
    return apiRequest<BoothStatus>("/booth-status");
  },

  freeMintStatus: async (
    walletAddress: string
  ): Promise<{ status: "claimed" | "not_claimed" }> => {
    return apiRequest<{ status: "claimed" | "not_claimed" }>(
      `/free-mint-status/${walletAddress}`
    );
  },

  freeMintPoolTxn: async (txn: string): Promise<{ group: string[] }> => {
    try {
      return await apiRequest<{ group: string[] }>(`/free-mint-pool-txn`, {
        method: "POST",
        body: JSON.stringify({ txn }),
      });
    } catch (error: any) {
      if (error.message.includes("400")) {
        throw new Error("Free mint already claimed");
      }
      throw error;
    }
  },

  // Check if wallet has a print request
  check: async (walletAddress: string): Promise<PrintRequest | null> => {
    try {
      return await apiRequest<PrintRequest>(
        `/check-print-request/${walletAddress}`
      );
    } catch (error: any) {
      if (
        error.message.includes("404") ||
        error.message.includes("No print request found")
      ) {
        return null;
      }
      throw error;
    }
  },

  // Get all print requests (public)
  getAll: async (
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<PrintRequest>> => {
    return apiRequest<PaginatedResponse<PrintRequest>>(
      `/print-request?page=${page}&limit=${limit}`
    );
  },

  // Get all print requests (admin only)
  getAllAdmin: async (
    page: number = 1,
    limit: number = 50,
    status?: string
  ): Promise<PaginatedResponse<PrintRequest>> => {
    const statusParam = status && status !== "all" ? `&status=${status}` : "";
    return authenticatedRequest<PaginatedResponse<PrintRequest>>(
      `/admin/print-request?page=${page}&limit=${limit}${statusParam}`
    );
  },

  // Update print request status (admin only)
  updateStatus: async (
    id: number,
    status: PrintRequest["status"]
  ): Promise<PrintRequest> => {
    return authenticatedRequest<PrintRequest>(`/print-request/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

// Admin APIs
export const adminApi = {
  // Admin login
  login: async (
    username: string,
    password: string
  ): Promise<{ token: string }> => {
    const response = await apiRequest<{ token: string }>("/admin-login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      credentials: "include", // Include cookies
    });

    // Store token for Bearer header usage
    if (response.token) {
      setAdminToken(response.token);
    }

    return response;
  },

  // Admin logout
  logout: (): void => {
    removeAdminToken();
  },

  // Get settings
  getSettings: async (): Promise<Settings> => {
    return authenticatedRequest<Settings>("/admin/settings");
  },

  // Update settings
  updateSettings: async (
    settings: Partial<Pick<Settings, "is_paused" | "max_print_requests">>
  ): Promise<Settings> => {
    return authenticatedRequest<Settings>("/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
  },
};
