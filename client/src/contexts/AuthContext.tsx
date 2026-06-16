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
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check storage on mount
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

  // FIXED: UI components တွေနဲ့ ကိုက်ညီအောင် interface ကို phone အတိုင်း ဆက်ထားတယ်
  const login = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      // api.ts က ပြင်ထားတဲ့ function ကို ဖုန်း input ထဲက တန်ဖိုး (SM-) လှမ်းပေးလိုက်တယ်
      const response = await authAPI.login(phone, password);
      
      // types.ts (LoginResponse) ရဲ့ Contract အမှန်အတိုင်းပဲ ခွဲထုတ်ဖတ်ယူတယ်
      const { token, id, email, role } = response.data;
      
      // AuthUser interface တည်ဆောက်ပုံအတိုင်း userData ကို လုံခြုံစွာ သတ်မှတ်တယ်
      const userData: AuthUser = {
        id,
        email,
        role,
        phone, // UI က လာတဲ့ SM- တန်ဖိုးကို phone နေရာမှာပဲ ပြန်သိမ်းထားပေးခြင်း
      };

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