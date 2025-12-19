const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface AuthResponse {
  token: string;
}

export interface User {
  _id: string;
  username: string;
  phone: string;
  avatar?: string;
  about?: string;
  status: "online" | "offline" | "last_seen";
  lastSeen?: string;
}

export const authApi = {
  async register(
    username: string,
    phoneNumber: string,
    password: string
  ): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, phoneNumber, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Registration failed");
    }
    return res.json();
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Login failed");
    }
    return res.json();
  },
};

export const usersApi = {
  async getAll(token: string): Promise<User[]> {
    const res = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },

  async getProfile(token: string): Promise<User> {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  },
};
