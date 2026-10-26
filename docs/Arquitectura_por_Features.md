# Arquitectura por Features — Guía Reutilizable

---

## ¿Qué es y por qué usarla?

La arquitectura por features agrupa todo lo que pertenece a una misma funcionalidad en una sola carpeta, en lugar de agrupar por tipo de archivo.

**En vez de esto:**

```
src/
  components/   (todos los componentes mezclados)
  hooks/        (todos los hooks mezclados)
  services/     (todos los servicios mezclados)
```

**Se organiza así:**

```
src/
  features/
    auth/       (todo lo relacionado con autenticación)
    auctions/   (todo lo relacionado con subastas)
    bids/       (todo lo relacionado con ofertas)
```

La ventaja principal es que cuando trabajas en una funcionalidad, todos los archivos que necesitas están en el mismo lugar. No tienes que saltar entre carpetas para encontrar el componente, el hook y el servicio de una misma cosa.

---

## Estructura para este proyecto (bidhud)

Bidhud tiene 4 features principales según el README: autenticación, subastas, ofertas y administración.

```
src/
├── app/                          # carpetas de rutas (Next.js App Router)
│   ├── (auth)/                   # grupo de rutas: login, register
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (main)/                   # grupo de rutas: páginas principales
│   │   ├── auctions/
│   │   │   ├── page.tsx          # catálogo de subastas
│   │   │   └── [id]/
│   │   │       └── page.tsx      # detalle de subasta
│   │   ├── my-auctions/
│   │   │   └── page.tsx
│   │   └── my-bids/
│   │       └── page.tsx
│   ├── admin/                    # rutas de administrador
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   └── auctions/
│   │       └── page.tsx
│   ├── api/                      # route handlers (la API interna de Next.js)
│   │   ├── auth/
│   │   ├── auctions/
│   │   ├── bids/
│   │   └── categories/
│   ├── favicon.ico
│   ├── globals.css
│   └── layout.tsx
│
├── features/                     # lógica organizada por funcionalidad
│   ├── auth/
│   │   ├── components/           # LoginForm, RegisterForm
│   │   ├── actions/              # server actions de autenticación
│   │   └── types.ts
│   ├── auctions/
│   │   ├── components/           # AuctionCard, AuctionForm, AuctionList
│   │   ├── actions/              # server actions de subastas
│   │   ├── queries.ts            # consultas a la BD
│   │   └── types.ts
│   ├── bids/
│   │   ├── components/           # BidForm, BidHistory
│   │   ├── actions/              # server actions de ofertas
│   │   └── types.ts
│   └── categories/
│       ├── components/
│       ├── actions/
│       └── types.ts
│
├── components/                   # componentes compartidos (usados en 2+ features)
│   ├── ui/                       # botones, inputs, modales genéricos
│   └── layout/                   # Navbar, Footer, Sidebar
│
├── lib/                          # utilidades y configuración
│   ├── db.ts                     # cliente de base de datos (Prisma / pg)
│   ├── auth.ts                   # configuración de sesión / NextAuth
│   └── utils.ts                  # funciones de ayuda genéricas
│
└── types/                        # tipos TypeScript globales
    └── index.ts
```

---

## Qué va en cada carpeta (guía reutilizable)

### `features/<nombre>/`

Una feature = una funcionalidad del negocio. Si la puedes describir con una sola acción del usuario ("hacer login", "publicar una subasta", "hacer una oferta"), merece su propia feature.

| Subcarpeta | Qué guarda |
|---|---|
| `components/` | Componentes de React que solo usa esta feature |
| `actions/` | Server Actions de Next.js (funciones que corren en el servidor) |
| `queries.ts` | Consultas a la base de datos de esta feature |
| `types.ts` | Los tipos TypeScript propios de esta feature |
| `hooks/` | Custom hooks si la feature tiene lógica de cliente compleja |

### `components/`

Componentes que se reutilizan en dos o más features. Si un componente solo lo usa `auctions/`, va dentro de `features/auctions/components/`, no aquí.

| Subcarpeta | Qué guarda |
|---|---|
| `ui/` | Piezas genéricas: Button, Input, Modal, Badge, Spinner |
| `layout/` | Navbar, Footer, Sidebar, PageWrapper |

### `lib/`

Archivos de configuración y utilidades que no son componentes ni lógica de negocio.

| Archivo | Qué guarda |
|---|---|
| `db.ts` | La instancia del cliente de BD (Prisma, pg, drizzle) |
| `auth.ts` | Configuración de autenticación (NextAuth, jose, lucia) |
| `utils.ts` | Funciones de ayuda: formatear fechas, convertir moneda, etc. |
| `validations.ts` | Schemas de Zod compartidos entre features |

### `app/api/`

Route Handlers de Next.js. Cada carpeta aquí es un endpoint de la API interna. Siguen la misma lógica de features: una carpeta por recurso.

```
app/api/auctions/route.ts       → GET /api/auctions, POST /api/auctions
app/api/auctions/[id]/route.ts  → GET /api/auctions/:id, PUT, DELETE
```

### `types/`

Solo para tipos que se usan en tres o más features a la vez. Si un tipo solo pertenece a una feature, va en `features/<nombre>/types.ts`.

> **Regla de oro:** si un archivo lo usas en dos lugares distintos, muévelo a `components/` o `lib/`. Si solo lo usa una feature, déjalo dentro de esa feature.

---

## Comandos para crear la arquitectura

### Linux / Mac — pega esto en la terminal desde la raíz del proyecto

```bash
mkdir -p src/features/auth/components src/features/auth/actions \
  src/features/auctions/components src/features/auctions/actions \
  src/features/bids/components src/features/bids/actions \
  src/features/categories/components src/features/categories/actions \
  src/components/ui src/components/layout \
  src/lib src/types

touch src/features/auth/types.ts \
  src/features/auctions/types.ts src/features/auctions/queries.ts \
  src/features/bids/types.ts \
  src/features/categories/types.ts \
  src/lib/db.ts src/lib/auth.ts src/lib/utils.ts \
  src/types/index.ts
```

### Windows — pega esto en PowerShell desde la raíz del proyecto

```powershell
$folders = @(
  "src/features/auth/components", "src/features/auth/actions",
  "src/features/auctions/components", "src/features/auctions/actions",
  "src/features/bids/components", "src/features/bids/actions",
  "src/features/categories/components", "src/features/categories/actions",
  "src/components/ui", "src/components/layout",
  "src/lib", "src/types"
)
foreach ($folder in $folders) {
  New-Item -ItemType Directory -Path $folder -Force
}

$files = @(
  "src/features/auth/types.ts",
  "src/features/auctions/types.ts",
  "src/features/auctions/queries.ts",
  "src/features/bids/types.ts",
  "src/features/categories/types.ts",
  "src/lib/db.ts",
  "src/lib/auth.ts",
  "src/lib/utils.ts",
  "src/types/index.ts"
)
foreach ($file in $files) {
  New-Item -ItemType File -Path $file -Force
}
```

---

## Para adaptar esto a otro proyecto

Cambia los nombres de las features en los comandos. Si tu proyecto es de e-commerce, reemplazas `auctions`, `bids` y `categories` por `products`, `cart` y `orders`. El resto de la estructura (`components/`, `lib/`, `types/`) siempre queda igual.

### Ejemplo de features comunes por tipo de proyecto

| Tipo de app | Features típicas |
|---|---|
| E-commerce | `products`, `cart`, `orders`, `auth` |
| Red social | `auth`, `posts`, `comments`, `profile` |
| SaaS (como el tuyo de barbería) | `auth`, `appointments`, `services`, `tenants` |
| Reservas deportivas | `auth`, `venues`, `bookings`, `payments` |
