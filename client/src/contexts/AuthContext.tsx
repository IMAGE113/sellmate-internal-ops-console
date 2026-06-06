import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { authAPI } from "@/lib/api";
import { AuthUser } from "@/lib/types";
import { secureStorage } from "@/lib/security";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use ref for cleanup tracking to prevent memory leaks
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = secureStorage.getItem("auth_token");
    const storedUser = secureStorage.getItem("auth_user");

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser) as AuthUser;
        setUser(userData);
      } catch (error) {
        console.error("Failed to parse stored user data", error);
        secureStorage.removeItem("auth_token");
        secureStorage.removeItem("auth_user");
      }
    }
    
    if (isMounted.current) {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(phone, password);
      
      // Destructure flattened response directly from backend
      const { token, id, email, role } = response.data;
      
      const userData: AuthUser = { id, email, role, phone };

      secureStorage.setItem("auth_token", token);
      secureStorage.setItem("auth_user", JSON.stringify(userData));
      
      if (isMounted.current) {
        setUser(userData);
      }
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const logout = useCallback(() => {
    secureStorage.removeItem("auth_token");
    secureStorage.removeItem("auth_user");
    if (isMounted.current) {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
