import Link from "next/link";
import { LocaleText } from "@/components/i18n/locale-text";
export default function ForbiddenPage(){return <main className="empty-state"><span className="empty-icon">⊘</span><h1><LocaleText es="Acceso restringido" en="Access restricted"/></h1><p><LocaleText es="Tu cuenta no tiene permisos para entrar al panel de administración." en="Your account cannot access the admin panel."/></p><Link className="button" href="/"><LocaleText es="Volver al inicio" en="Back to home"/></Link></main>;}
