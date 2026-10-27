# Guía paso a paso para construir un proyecto fullstack

Esta guía es un procedimiento reutilizable para que puedas repetir por tu cuenta un proyecto con Next.js, TypeScript, PostgreSQL y Prisma. La bitácora de BidHub muestra qué se hizo y en qué archivos. Úsala como cuaderno: reproduce una etapa, corre su comprobación y anota el resultado antes de pasar a la siguiente.

## Método reusable

### 1. Lee el encargo y convierte frases en reglas

1. Lee el documento completo antes de tocar archivos.
2. Agrupa cada requisito en negocio, seguridad, páginas, API, datos, despliegue y entregables.
3. Convierte cada frase en una condición verificable. Ejemplo: «no puede cerrar en menos de una hora» significa comprobar el tiempo dentro del servicio de backend, no solamente agregar `min` a un input.
4. Distingue lo que puede verificar el código localmente de lo que necesita cuenta, base de datos o aprobación externa.

**Resultado esperado:** una lista de alcance y una primera definición de terminado.

### 2. Inspecciona antes de editar

1. Lee `AGENTS.md`, la guía del framework instalado y los archivos `package.json`, configuración, esquema, rutas y Git.
2. Comprueba la versión exacta de Next y Prisma. Las APIs nuevas pueden romper las convenciones de versiones anteriores.
3. Revisa si ya existe arquitectura o código que se deba conservar. No confundas archivo vacío con permiso para borrar el trabajo del usuario.
4. Escribe una lista de archivos pendientes antes de empezar.

**Resultado esperado:** mapa de restricciones, piezas existentes y cambios por hacer.

### 3. Dibuja el dominio y las rutas

1. Escribe entidades y relaciones (por ejemplo, usuario → subastas → ofertas).
2. Decide qué rol puede ejecutar cada acción.
3. Diseña la URL de páginas y API. Usa route groups de Next para organizar páginas sin añadir segmentos a las URLs.
4. Define los cuerpos JSON y la forma de éxito/error antes de conectar la interfaz.

**Resultado esperado:** esquema de datos y contratos de API que se puedan explicar.

### 4. Prepara herramientas y entorno

1. Instala versiones compatibles y guarda `package-lock.json`.
2. Configura Prisma y valida el schema antes de conectar a datos reales.
3. Mantén `.env` fuera de Git y deja en `.env.example` solo nombres y valores vacíos/default no secretos.
4. Separa URL runtime de URL de migraciones si el proveedor ofrece poolers distintos.

**Resultado esperado:** aplicación compilable y secretos fuera del repositorio.

### 5. Modela y migra la base

1. Define modelos, relaciones, claves únicas e índices a partir del dominio.
2. Ejecuta `npx prisma format`, `npx prisma validate` y `npx prisma generate`.
3. En una base de desarrollo crea una migración nombrada (`npx prisma migrate dev --name nombre_claro`).
4. Lee el SQL generado y comprueba que no tenga drops, truncados ni cambios no previstos.
5. En base compartida/producción aplica migraciones versionadas con `npx prisma migrate deploy`.
6. Ejecuta el seed de forma repetible. No metas contraseñas reales al código.

**Resultado esperado:** esquema recreable desde migraciones y datos de ejemplo seguros.

### 6. Implementa los casos de uso del backend

Para cada endpoint:

1. Valida parámetros y JSON de entrada con Zod.
2. Comprueba autenticación y rol dentro del handler; el proxy solo mejora navegación.
3. Coloca la regla de negocio en un servicio del dominio que también pueda llamarse desde otra interfaz.
4. Aplica transacciones/locks cuando dos operaciones puedan competir.
5. Evita filtrar datos privados en respuestas públicas.
6. Devuelve un formato uniforme y el código HTTP adecuado.
7. Cubre por lo menos una regla pura con una prueba.

**Resultado esperado:** llamar a la API directamente no permite saltarse las reglas de la pantalla.

### 7. Construye la interfaz por flujos completos

Implementa una acción cada vez: estados inicial, cargando, éxito, vacío y error. Conecta formularios a la API y muestra el error que responde el backend. Revisa autorización, navegación móvil, etiquetas accesibles e imágenes. Para datos del usuario usa CSR; para catálogos/detalles usa SSR/streaming detrás de `Suspense`; deja una carcasa estática para páginas que deban prerenderizarse.

**Resultado esperado:** flujos de principio a fin, no solamente componentes visuales.

### 8. Revisa y entrega

1. Ejecuta generación de tipos, TypeScript, lint, pruebas y build.
2. Prueba el README desde un checkout limpio si hay base de desarrollo disponible.
3. Comprueba que `.env` y credenciales no entren a `git status`.
4. Actualiza la guía con comandos reales y pendientes.
5. Despliega solo con acceso a cuentas y variables necesarias; anota la URL real, sin inventarla.

**Resultado esperado:** otra persona puede entender qué hacer, cómo comprobarlo y qué falta por cuenta externa.

## BidHub: recorrido concreto que se siguió

### A. Requisitos → arquitectura

- Requisitos completos: `docs/.md`.
- Arquitectura del usuario: `docs/Arquitectura_por_Features.md`.
- El dominio principal es `User`, `Category`, `Auction`, `Bid` y `RefreshToken`. Los estados finales se derivan al consultar usando `closesAt`, cantidad de ofertas y cancelación guardada.
- La decisión de privacidad es enviar `bidderAlias`, monto y fecha en el historial público; el correo y nombre completo nunca salen.

### B. Configuración → persistencia

Archivos: `prisma/schema.prisma`, `prisma7.config.ts`, `src/lib/db.ts`, `.env.example`.

Después de editar schema, el orden de verificación es:

```bash
npx prisma format
npx prisma validate
npx prisma generate
```

Para desarrollo, crear migración con `npm run db:migrate -- --name nombre_descriptivo`. Revisar `prisma/migrations/<timestamp>_nombre/migration.sql`. Para desplegar migraciones revisadas: `npm run db:migrate:deploy`. Para datos ficticios: `npm run db:seed`.

La CLI detecta la configuración en `prisma7.config.ts`; su propiedad `migrations.seed` indica `tsx prisma/seed.ts`. Prisma 7 no toma la URL desde el bloque `datasource` de `schema.prisma`; este proyecto la lee en el archivo de configuración.

### C. Backend por feature

| Área | Archivos principales | Qué aprender de este ejemplo |
|---|---|---|
| Autenticación | `src/features/auth/schemas.ts`, `src/lib/password-core.ts`, `src/lib/auth.ts`, `src/app/api/auth/*` | Validar credenciales, hashear, firmar tokens, guardar hash del refresh, rotar/revocar y fijar cookies httpOnly. |
| Autorización | `src/lib/authorization.ts`, `proxy.ts` | El proxy filtra navegación; cada route handler vuelve a comprobar sesión/rol con datos actuales. |
| Subastas | `src/features/auctions/schemas.ts`, `domain.ts`, `service.ts`, `queries.ts` | Separar forma de entrada, reglas puras, operaciones transaccionales y lectura/serialización. |
| Ofertas | `src/app/api/auctions/[id]/bids/route.ts`, `src/features/auctions/service.ts` | Lock de fila, verificación de mínimo, no auto-oferta, idempotencia y extensión antipuja de último segundo. |
| Categorías | `src/features/categories/schemas.ts`, `src/app/api/categories/*` | Rechazar borrado cuando la relación todavía se usa. |
| Paneles | `src/features/dashboard/*`, `src/features/admin/*` | Leer datos propios mediante endpoints protegidos; exigir motivo para moderación. |

### D. Interfaz y agrupación de rutas

| Grupo | URLs visibles | Archivos |
|---|---|---|
| `(public)` | `/`, `/auctions`, `/auctions/[id]` | `src/app/(public)`; navbar/footer, tarjetas, filtros, detalle, historial y cuenta regresiva cliente. |
| `(auth)` | `/login`, `/register` | `src/app/(auth)` y `src/components/forms/auth-form.tsx`. |
| `(private)` | `/my-auctions`, `/my-bids`, `/auctions/new`, `/auctions/[id]/edit` | `src/app/(private)` y `src/features/dashboard`, `src/features/auctions/auction-form.tsx`. |
| `(admin)` | `/admin/auctions`, `/admin/categories` | `src/app/(admin)` y `src/features/admin`. |

`src/app/layout.tsx` es el root layout. La home no consulta la base y se genera estática (SSG); catálogo y detalle consultan datos al solicitarse y los transmiten bajo `Suspense`; dashboards consultan la API desde el cliente (CSR). `next/image` usa una ilustración local como fallback en `public/items/collectible.svg`.

### E. Reglas de negocio y sus comprobaciones

1. Cierre 1h–7d, máximo cinco subastas activas y cambios permitidos: `src/features/auctions/service.ts`.
2. No pujar por cuenta propia, mínimo inicial/incremento, usuario líder no repite, bloqueo y extensión de cinco minutos: `placeBid` en ese mismo servicio.
3. Estado activo/cerrada/desierta/cancelada: `deriveAuctionStatus` en `domain.ts`.
4. Historial oculta identidad: `maskBidder` en `queries.ts`.
5. El usuario solo ve sus propias ofertas: `GET /api/me/bids` filtra con el `bidderId` derivado de la sesión.
6. Pruebas de estado y anti-sniping: `src/features/auctions/domain.test.ts`, ejecutadas con `npm test`.

### F. Comandos que se ejecutaron para revisar el código

```bash
npx next typegen
npx tsc --noEmit
npm run lint
npm test
npm run build
npx prisma validate
npx prisma generate
```

En este entorno, `npm test` falló dentro del sandbox con `uv_os_get_passwd returned ENOMEM`; al ejecutarlo con permisos ampliados pasó con 5/5. El build de Next 16 exige mover acceso a `params`, datos de base y tiempo actual bajo `Suspense`/`connection()` cuando Cache Components está activo. Si el prerender avisa de datos uncached, revisa dónde se resuelve la promesa antes de desactivar el cache global.

### G. Seed, variables y contenedor

- Seed: `prisma/seed.ts`. Crea/actualiza un administrador, usuario demo, cinco categorías y cuatro subastas con estados representativos; requiere `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `DEMO_USER_PASSWORD` en `.env`, con contraseñas de mínimo 12 caracteres. Se generaron credenciales fuertes y aleatorias en el `.env` local (ignorado por Git), y el seed se completó en Supabase producción.
- Variables: copia `.env.example` a `.env`. `DATABASE_URL` se usa en runtime; `DIRECT_URL` para operaciones CLI si Supabase separa pooler transaccional y de sesión.
- Entrega: `README.md`, `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.github/workflows/ci.yml`.
- Docker asume una base externa. Primero se configura `.env` y se aplica migración/seed; luego `docker compose build` y `docker compose up -d`.

## Bitácora de BidHub al 26 de octubre de 2026

| Etapa | Estado | Evidencia |
|---|---|---|
| Leer requisitos e inspeccionar repo | Completo | `docs/.md`, arquitectura por features y `AGENTS.md` leídos. Se consultó documentación local de Next 16 y Prisma 7. |
| Preparar herramientas | Completo | Next 16.4.3, Prisma 7.10.1, TypeScript, Zod, jose, tsx; `.env.example` y configuración CLI. |
| Modelar y validar datos | Completo en código | Esquema validado y Prisma Client generado. |
| Migración inicial | Aplicada previamente | El usuario mostró en Supabase la fila `init` en `_prisma_migrations` y las tablas. |
| Migración de seguimiento | Aplicada en Supabase `main` (producción) | `20261026160000_auth_audit_and_rate_limit`: añade `Auction.cancelledById`, tabla e índice de rate limit y activa RLS en seis tablas. `npx prisma migrate deploy` terminó correctamente el 26-10-2026. |
| Auth y APIs | Implementado; esquema de producción sincronizado | Hash scrypt, access/refresh, cookies, registro/login/refresh/logout/me; endpoints de subastas, ofertas, categorías, panel y admin. La tabla nueva de rate limit ya está disponible. |
| UI por route groups | Implementado | Home estática, catálogo/detalle con datos al solicitarse, dashboards CSR, auth, forms, administración, cuenta regresiva y selector ES/EN en flujos principales. `next/image` y estilos adaptables. |
| Seed, README, Docker y CI | Implementado | Archivos `prisma/seed.ts`, `README.md`, `Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml`. |
| Chequeo estático | Pasa | `npx tsc --noEmit`, `npm run lint`, `npx prisma validate`, `npx prisma generate`. |
| Prueba de regla | Pasa | `npm test`: cinco casos, 5 aprobados. Requirió correr fuera del sandbox por fallo de runtime. |
| Build de producción | Pasa | `npm run build`; home/catálogo/detalle muestran shell prerenderizado con contenido dinámico en streaming. |
| Migración DB | Completa | `npx prisma migrate deploy` aplicó la única migración pendiente en Supabase `main`; `migrate status` había confirmado que era la migración esperada. |
| Seed real | Completo | `npx prisma db seed` creó/actualizó `admin@bidhub.local` (ADMIN), `coleccionista@bidhub.local` (USER), cinco categorías, cuatro subastas y una oferta. Se verificaron los registros con una consulta de solo lectura. Las contraseñas aleatorias están en `.env`, ignorado por Git; no se registraron ni se subieron. |
| Despliegue de Vercel | Pendiente de conexión | No hay URL real conectada en el repo. El README explica variables y orden; no se inventó un dominio. |
| Push convencional | Completo | Los cambios están en `origin/main` con mensajes Conventional Commit. |

### Qué revisar después de sincronizar la base real

La migración y el seed ya se aplicaron en Supabase `main`. Las credenciales de las dos cuentas de demostración están en el `.env` local; consulta allí los valores para iniciar sesión y no los subas a Git. Comprueba login, rate limit, cancelación y creación de ofertas con dos cuentas distintas.

### Entrega y aprendizaje

Para repetir el proyecto, usa primero `README.md` como receta de ejecución y esta guía como explicación de decisiones y orden de trabajo. Cuando cambies una regla, actualiza en conjunto: esquema Zod, servicio, handler, interfaz si corresponde, prueba de dominio y esta bitácora.
