import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/auth-form";
import { LocaleText } from "@/components/i18n/locale-text";
export const metadata: Metadata = { title: "Iniciar sesión" };
export default function LoginPage() { return <><span className="eyebrow"><LocaleText es="QUÉ BUENO VERTE" en="WELCOME BACK"/></span><h1><LocaleText es="Inicia sesión" en="Sign in"/></h1><p className="muted"><LocaleText es="Entra y sigue las piezas que te interesan." en="Sign in to follow the pieces you care about."/></p><AuthForm mode="login"/></>; }
