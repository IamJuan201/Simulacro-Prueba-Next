import Link from "next/link";
export default function ForbiddenPage(){return <main className="empty-state"><span className="empty-icon">⊘</span><h1>Acceso restringido</h1><p>Tu cuenta no tiene permisos para entrar al panel de administración.</p><Link className="button" href="/">Volver al inicio</Link></main>;}
