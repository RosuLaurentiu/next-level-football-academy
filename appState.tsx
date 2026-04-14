import type { ReactNode } from "react";
import { useAppState } from "./appStateContext";
import { LocalAppStateProvider } from "./localAppState";
import { SupabaseAppStateProvider } from "./supabaseAppState";
import { isSupabaseConfigured } from "./supabaseClient";

export function AppStateProvider({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured) {
    return <SupabaseAppStateProvider>{children}</SupabaseAppStateProvider>;
  }

  return <LocalAppStateProvider>{children}</LocalAppStateProvider>;
}

export { useAppState };
