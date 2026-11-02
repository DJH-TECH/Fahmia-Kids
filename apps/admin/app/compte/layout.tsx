import { AccountFrame } from "@/components/AccountFrame";

export const metadata = { title: "Mon compte · Fahmia Kids" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccountFrame mode="client">{children}</AccountFrame>;
}
