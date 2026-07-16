import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json() as Promise<AuthUser>;
}

async function postRegister(data: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Registration failed");
  return body as AuthUser;
}

async function postLogin(data: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Login failed");
  return body as AuthUser;
}

async function postLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const registerMutation = useMutation({
    mutationFn: postRegister,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth-me"], user);
    },
  });

  const loginMutation = useMutation({
    mutationFn: postLogin,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth-me"], user);
      // Invalidate savings cache so it reloads for the new user
      queryClient.invalidateQueries({ queryKey: ["savings-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goal"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: postLogout,
    onSuccess: () => {
      queryClient.setQueryData(["auth-me"], null);
      queryClient.invalidateQueries({ queryKey: ["savings-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goal"] });
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    register: registerMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    registerError: registerMutation.error?.message,
    loginError: loginMutation.error?.message,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
  };
}
