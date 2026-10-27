# BidHub

BidHub es una plataforma fullstack de subastas para artículos de colección. Incluye catálogo público, cuentas con access y refresh tokens en cookies seguras, publicación y edición de subastas, ofertas con control de concurrencia e idempotencia, panel personal y moderación. La interfaz está preparada en español e inglés.

## Requisitos previos

- Node.js 22 LTS y npm (Node 20.19 o superior también es compatible con Prisma 7).
- Git.
- Una base PostgreSQL en Supabase.
- Docker Desktop si se quiere ejecutar el contenedor.

## Configuración desde cero

1. Clona e instala dependencias:

   ```bash
   git clone https://github.com/IamJuan201/Simulacro-Prueba-Next.git
   cd Simulacro-Prueba-Next
   npm ci
   ```

2. Crea `.env` a partir del ejemplo:

   ```bash
   cp .env.example .env
   ```

   En PowerShell: `Copy-Item .env.example .env`.

3. Completa las variables:

   | Variable | Uso y valor |
   |---|---|
   | `DATABASE_URL` | URL PostgreSQL para la aplicación. En Supabase usa **Connect → Transaction pooler** (normalmente puerto 6543). |
   | `DIRECT_URL` | URL de conexión para migraciones. Usa Supabase **Session pooler** (normalmente puerto 5432) o Direct connection si tu red permite IPv6. Prisma CLI la prefiere cuando existe. |
   | `JWT_ACCESS_SECRET` | Secreto aleatorio de al menos 32 bytes para el access token. |
   | `JWT_REFRESH_SECRET` | Otro secreto aleatorio, distinto y de al menos 32 bytes, para refresh. |
   | `ACCESS_TOKEN_EXPIRES_IN` | Duración del access token; por defecto `15m`. Unidades admitidas: `s`, `m`, `h`, `d`. |
   | `REFRESH_TOKEN_EXPIRES_IN` | Duración del refresh token; por defecto `7d`. |
   | `ADMIN_EMAIL` | Correo del administrador creado por el seed; por defecto `admin@bidhub.local`. |
   | `ADMIN_PASSWORD` | Contraseña elegida por ti para el administrador; mínimo 12 caracteres. El seed sincroniza esta contraseña cada vez que corre. |
   | `ADMIN_FULL_NAME` | Nombre visible del administrador. |
   | `DEMO_USER_EMAIL` | Cuenta de ejemplo que permite crear historial de ofertas; por defecto `coleccionista@bidhub.local`. |
   | `DEMO_USER_PASSWORD` | Contraseña elegida por ti para esa cuenta; mínimo 12 caracteres. |
   | `DEMO_USER_FULL_NAME` | Nombre visible de la cuenta de ejemplo. |
   | `APP_URL` | URL pública de la aplicación, por ejemplo `http://localhost:3000` en local. |

   Genera secretos JWT con `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"` (ejecuta el comando dos veces). No subas `.env` a Git. Para obtener las URLs en Supabase abre el proyecto, pulsa **Connect** y copia los valores del pooler indicado; reemplaza usuario, contraseña y nombre de base según tu proyecto.

4. Aplica el esquema y crea los datos de ejemplo:

   ```bash
   npm run db:generate
   npm run db:migrate:deploy
   npm run db:seed
   ```

   `migrate deploy` aplica en orden las migraciones versionadas (`init` y la migración de seguimiento). Revisa primero el SQL de cada migración y úsalo con una base nueva/de desarrollo o una base compartida previamente revisada. Para diseñar una migración nueva durante desarrollo, ejecuta `npm run db:migrate -- --name nombre_descriptivo`; después verifica el SQL, guarda el archivo en Git y genera el cliente. El esquema de este repositorio tiene una migración de seguimiento pendiente que añade el actor de cancelación, el bucket de rate limiting y RLS. No uses `migrate reset` sobre una base con datos importantes.

5. Arranca la aplicación:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000). Inicia sesión con el correo y la contraseña que configuraste en `ADMIN_EMAIL` y `ADMIN_PASSWORD`. La cuenta de ejemplo usa los valores `DEMO_USER_EMAIL` y `DEMO_USER_PASSWORD` que elegiste.

## Docker

El contenedor se conecta a PostgreSQL externo; crea `.env` antes de iniciar. Genera el cliente y aplica migraciones con la misma versión de código antes del primer arranque.

```bash
docker compose build
docker compose up -d
docker compose logs -f bidhub
```

Para detenerlo: `docker compose down`. También puedes ejecutar `docker build -t bidhub .` y `docker run --env-file .env -p 3000:3000 bidhub`.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor local de desarrollo. |
| `npm run build` | Compila para producción (salida standalone para Docker). |
| `npm start` | Sirve la compilación local de producción. |
| `npm run lint` | Ejecuta ESLint. |
| `npx tsc --noEmit` | Comprueba tipos TypeScript. |
| `npm test` | Ejecuta pruebas de reglas de subastas. |
| `npm run db:generate` | Genera Prisma Client. |
| `npm run db:migrate -- --name nombre` | Crea/aplica migración en base de desarrollo. |
| `npm run db:migrate:deploy` | Aplica migraciones pendientes en el entorno configurado. |
| `npm run db:seed` | Inserta/actualiza administrador, usuario y datos demostrativos. |

## Rutas principales

- `/` inicio; `/auctions` catálogo y filtros; `/auctions/[id]` detalle e historial.
- `/register` y `/login` autenticación.
- `/auctions/new`, `/auctions/[id]/edit`, `/my-auctions` y `/my-bids` requieren sesión.
- `/admin/auctions` y `/admin/categories` requieren rol ADMIN.
- `/api/auth/*`, `/api/auctions/*`, `/api/categories/*`, `/api/me/*` y `/api/admin/*` son los route handlers. Cada handler aplica sus propios permisos.

## Renderizado e idiomas

La portada es estática (SSG), catálogo y detalle resuelven datos al solicitarse y transmiten el contenido con Suspense, y los paneles personales/admin cargan sus datos desde el cliente (CSR). El selector ES/EN traduce navegación, portada, autenticación, catálogo, formularios, detalle, dashboards y administración; los títulos/descripciones escritos por usuarios conservan el idioma en que fueron publicados.

## Estructura del proyecto

```text
src/app/(public)       Inicio, catálogo y detalle públicos
src/app/(auth)         Login y registro
src/app/(private)      Panel personal y publicación/edición
src/app/(admin)        Moderación y categorías
src/app/api            API Route Handlers
src/components         Componentes compartidos e interfaz
src/features           Dominio y servicios por feature
src/lib                Prisma, auth, autorización y utilidades
prisma                 Esquema, migraciones y seed
docs                   Requisitos, arquitectura y guía práctica
```

## Verificación y CI

GitHub Actions ejecuta `npm ci`, generación de Prisma Client, lint, TypeScript, pruebas y build en cada push a `main` y pull request. Las pruebas actuales comprueban estado derivado de subastas y extensión del cierre. Para probar la aplicación manualmente, registra un usuario, crea una subasta, oferta desde otra cuenta, revisa los dos paneles y prueba moderación con la cuenta admin.

## Despliegue

La base prevista es Supabase y el runtime es Vercel. Para conectar Vercel: importa este repositorio, configura todas las variables de `.env.example` en Production/Preview, usa el pooler de transacciones en `DATABASE_URL`, el pooler de sesión en `DIRECT_URL`, y aplica migraciones con `npx prisma migrate deploy` desde un entorno controlado antes de publicar. Define `APP_URL` con el dominio asignado por Vercel y verifica registro, refresh, ofertas y panel admin.

**URL desplegada:** pendiente de conectar el proyecto a una cuenta Vercel y aplicar la migración de seguimiento en Supabase. No se inventa una URL; al completar esa conexión, reemplaza esta línea por la URL real.

## Reglas destacadas

El backend limita a cinco subastas activas por vendedor, exige cierre entre una hora y siete días, impide ofertar en la propia subasta o superar la oferta vigente con un incremento insuficiente, bloquea edición/cancelación del vendedor después de recibir ofertas y extiende cinco minutos el cierre cuando corresponde. Las ofertas usan transacciones serializables, bloqueo de fila e idempotency key. El historial público oculta correo y nombre completo de los postores.
