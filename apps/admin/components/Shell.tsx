"use client";

import { AccountFrame } from "@/components/AccountFrame";

export function Shell({ children }: { children: React.ReactNode }) {
  return <AccountFrame mode="admin">{children}</AccountFrame>;
}
