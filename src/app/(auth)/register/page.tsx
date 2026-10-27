import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/auth-form";
import { LocaleText } from "@/components/i18n/locale-text";
export const metadata: Metadata = { title: "Crear cuenta" };
export default function RegisterPage() { return <><span className="eyebrow"><LocaleText es="BIENVENIDO A BIDHUB" en="WELCOME TO BIDHUB"/></span><h1><LocaleText es="Únete a la comunidad" en="Join the community"/></h1><p className="muted"><LocaleText es="Crea tu cuenta para publicar y ofertar." en="Create your account to list items and place bids."/></p><AuthForm mode="register"/></>; }
