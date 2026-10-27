import type { Metadata } from "next";
import { AdminAuctionsPanel } from "@/features/admin/admin-auctions-panel";
export const metadata: Metadata = { title: "Moderación" };
export default function AdminAuctionsPage(){return <AdminAuctionsPanel/>;}
