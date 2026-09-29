import type { Metadata } from "next";
import { AdminView } from "./AdminView";

export const metadata: Metadata = { title: "Data Stewardship" };

export default function AdminPage() {
  return <AdminView />;
}
