"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { apiFetch } from "@/features/auth/api";

type Category = { id: string; name: string; slug: string };

export function CategoriesPanel() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const { locale, t } = useLocale();
  const english = locale === "en";

  async function load() {
    const response = await apiFetch("/api/categories");
    const result = await response.json() as { data?: Category[] };
    setItems(result.data || []);
  }

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/categories").then(async (response) => response.json() as Promise<{ data?: Category[] }>).then((result) => {
      if (!cancelled) setItems(result.data || []);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await apiFetch(editing ? `/api/categories/${editing}` : "/api/categories", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const result = await response.json() as { error?: { message: string } };
    if (!response.ok) { setError(result.error?.message || (english ? "Could not save the category." : "No se pudo guardar.")); return; }
    setEditing(null);
    setName("");
    await load();
  }

  async function remove(id: string) {
    const response = await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
    const result = await response.json() as { error?: { message: string } };
    if (!response.ok) { setError(result.error?.message || (english ? "Could not delete the category." : "No se pudo eliminar.")); return; }
    await load();
  }

  return <>
    <div className="page-heading"><div><span className="eyebrow">{english ? "ORGANIZE THE CATALOG" : "ORGANIZA EL CATÁLOGO"}</span><h1>{english ? "Categories" : "Categorías"}</h1><p className="muted">{english ? "Categories linked to auctions cannot be deleted." : "Las categorías con subastas asociadas no se pueden eliminar."}</p></div></div>
    <form className="category-create" onSubmit={save}><label>{editing ? (english ? "Edit category" : "Editar categoría") : t("createCategory")}<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={40} required /></label><button className="button">{editing ? t("save") : t("createCategory")}</button>{editing && <button type="button" className="text-link" onClick={() => { setEditing(null); setName(""); }}>{t("cancel")}</button>}</form>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="category-list">{items.map((category) => <article className="category-row" key={category.id}><div><strong>{category.name}</strong><span>{category.slug}</span></div><div><button className="button button-quiet" onClick={() => { setEditing(category.id); setName(category.name); }}>{t("edit")}</button><button className="button button-quiet" onClick={() => void remove(category.id)}>{t("delete")}</button></div></article>)}</div>
  </>;
}
