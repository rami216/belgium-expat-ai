"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define what our User looks like
type User = {
  id: string;
  email: string;
  full_name: string;
  profile_type: string;
  avatar_url: string;
} | null;

type AuthContextType = {
  user: User;
  loadingAuth: boolean;
};

// Create the Context
const AuthContext = createContext<AuthContextType>({ user: null, loadingAuth: true });

// Create the Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoadingAuth(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to make importing it super clean!
export function useAuth() {
  return useContext(AuthContext);
}