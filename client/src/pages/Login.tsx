import React, { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";
import { sanitize } from "@/lib/security";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize inputs before processing
    const sanitizedPhone = sanitize(phone.trim());
    const sanitizedPassword = password; // Passwords shouldn't be HTML-sanitized but handled carefully

    if (!sanitizedPhone || !sanitizedPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login(sanitizedPhone, sanitizedPassword);
      toast.success("Login successful");
      setLocation("/dashboard");
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Login failed";
      const correlationId = error.correlationId;
      
      toast.error(
        <div className="flex flex-col gap-1">
          <span>{errorMsg}</span>
          {correlationId && <span className="text-[10px] opacity-70 font-mono">ID: {correlationId}</span>}
        </div>
      );
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [phone, password, login, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
          <div className="p-8">
            <div className="flex justify-center mb-8">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-foreground mb-2">
              SellMate Ops
            </h1>
            <p className="text-center text-muted-foreground mb-8">
              Internal Operations Console
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  autoComplete="tel"
                  className="bg-input border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="bg-input border-border"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Super Admin Access Only
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
