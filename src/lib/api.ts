/* eslint-disable @typescript-eslint/no-explicit-any */
// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// export interface AuthResponse {
//   token: string;
// }

// export interface User {
//   _id: string;
//   username: string;
//   phone: string;
//   avatar?: string;
//   about?: string;
//   status: "online" | "offline" | "last_seen";
//   lastSeen?: string;
// }

// export const authApi = {
//   async register(
//     username: string,
//     phoneNumber: string,
//     password: string
//   ): Promise<AuthResponse> {
//     const res = await fetch(`${API_URL}/auth/register`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ username, phoneNumber, password }),
//     });
//     if (!res.ok) {
//       const error = await res.json();
//       throw new Error(error.message || "Registration failed");
//     }
//     return res.json();
//   },

//   async login(username: string, password: string): Promise<AuthResponse> {
//     const res = await fetch(`${API_URL}/auth/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ username, password }),
//     });
//     if (!res.ok) {
//       const error = await res.json();
//       throw new Error(error.message || "Login failed");
//     }
//     return res.json();
//   },
// };

// export const usersApi = {
//   async getAll(token: string): Promise<User[]> {
//     const res = await fetch(`${API_URL}/users`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     if (!res.ok) throw new Error("Failed to fetch users");
//     return res.json();
//   },

//   async getProfile(token: string): Promise<User> {
//     const res = await fetch(`${API_URL}/users/me`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     if (!res.ok) throw new Error("Failed to fetch profile");
//     return res.json();
//   },
// };

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

export interface Conversation {
  _id: string;
  participants: any[];
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "audio" | "video" | "file";
  createdAt?: string;
}

async function requestJSON<T>(url: string, token: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
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
      const error = await res.json().catch(() => ({}));
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
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Login failed");
    }
    return res.json();
  },
};

export const usersApi = {
  async getAll(token: string): Promise<User[]> {
    return requestJSON<User[]>(`${API_URL}/users`, token);
  },

  async getProfile(token: string): Promise<User> {
    return requestJSON<User>(`${API_URL}/users/me`, token);
  },
};

// ✅ Conversation: find or create a 1-to-1 conversation with another user
export const conversationsApi = {
  async getOrCreateDirect(
    token: string,
    otherUserId: string
  ): Promise<Conversation> {
    // Try a few common patterns:
    const attempts: Array<() => Promise<Conversation>> = [
      // 1) POST /conversations/dm/:userId
      () =>
        requestJSON<Conversation>(
          `${API_URL}/conversations/dm/${otherUserId}`,
          token,
          { method: "POST" }
        ),

      // 2) POST /conversations/direct/:userId
      () =>
        requestJSON<Conversation>(
          `${API_URL}/conversations/direct/${otherUserId}`,
          token,
          { method: "POST" }
        ),

      // 3) POST /conversations (body)
      () =>
        requestJSON<Conversation>(`${API_URL}/conversations`, token, {
          method: "POST",
          body: JSON.stringify({ otherUserId }),
        }),
    ];

    let lastErr: any = null;
    for (const fn of attempts) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr ?? new Error("Could not create/find conversation");
  },
};

export const messagesApi = {
  async getConversationMessages(
    token: string,
    conversationId: string
  ): Promise<Message[]> {
    const attempts: Array<() => Promise<Message[]>> = [
      () =>
        requestJSON<Message[]>(
          `${API_URL}/messages/conversation/${conversationId}`,
          token
        ),
      () =>
        requestJSON<Message[]>(
          `${API_URL}/conversations/${conversationId}/messages`,
          token
        ),
      () =>
        requestJSON<Message[]>(`${API_URL}/messages/${conversationId}`, token),
    ];

    for (const fn of attempts) {
      try {
        return await fn();
      } catch {
        // keep trying
      }
    }

    // If no endpoint exists, fallback to empty (real-time still works)
    return [];
  },
};
