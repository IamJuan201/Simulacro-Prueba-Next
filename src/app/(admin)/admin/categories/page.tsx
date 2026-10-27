import type { Metadata } from "next";
import { CategoriesPanel } from "@/features/admin/categories-panel";
export const metadata: Metadata = { title: "Administrar categorías" };
export default function AdminCategoriesPage(){return <CategoriesPanel/>;}
