"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { setApiAccessToken } from "@/lib/api";

export function AuthApiSync() {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    setApiAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    const unsub = useAuthStore.subscribe((state) => {
      setApiAccessToken(state.accessToken);
    });
    setApiAccessToken(useAuthStore.getState().accessToken);
    return unsub;
  }, []);

  return null;
}
