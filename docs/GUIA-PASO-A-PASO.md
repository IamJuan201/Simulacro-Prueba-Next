# Guía paso a paso para construir un proyecto fullstack

Esta guía sirve como método reutilizable para proyectos fullstack con Next.js, TypeScript, PostgreSQL y Prisma. BidHub se usa como ejemplo para que cada paso tenga archivos y comandos concretos.

La idea es completar y verificar una etapa antes de pasar a la siguiente. En cada etapa:

1. Aclara qué resultado se busca.
2. Identifica los archivos que participan.
3. Implementa una parte pequeña y entiende por qué existe.
4. Ejecuta la verificación indicada.
5. Anota el resultado y los pendientes.

No marques una etapa como completa solo porque el código ya está escrito: debe pasar la verificación correspondiente.

## Método reusable

### 1. Entender el problema

- Lee el documento de requisitos completo antes de programar.
- Separa requisitos de negocio, seguridad, tecnología, interfaz y entrega.
- Convierte cada regla en una condición comprobable. Por ejemplo: «el cierre debe estar entre 1 hora y 7 días» se convierte en una validación del backend y en un caso verificable.
- Anota dudas, decisiones técnicas y lo que queda fuera del alcance.

**Resultado:** un alcance claro y una lista priorizada de funcionalidades.

### 2. Inspeccionar el proyecto existente

- Revisa `package.json`, el árbol de `src/`, archivos de configuración y Git.
- Identifica qué ya existe y qué está vacío antes de reemplazar archivos.
- Lee `AGENTS.md` y cualquier instrucción local.
- Si el proyecto usa una versión nueva o poco conocida de un framework, consulta la documentación instalada en el repositorio antes de escribir código.

**Resultado:** un inventario de lo reutilizable, lo pendiente y las restricciones.

### 3. Diseñar el dominio y la arquitectura

- Identifica entidades, atributos, relaciones y quién puede hacer cada acción.
- Dibuja o escribe las relaciones antes de escoger tablas.
- Decide qué reglas deben cumplirse en la base de datos y cuáles en servicios del backend.
- Organiza las páginas por rutas y el código de dominio por features.
- Define los contratos de entrada y salida de las API antes de conectar la interfaz.

**Resultado:** un modelo de datos y un mapa de rutas/API que se puedan explicar.

### 4. Preparar herramientas y configuración

- Instala dependencias con versiones explícitas cuando haya cambios importantes entre versiones.
- Crea el archivo de configuración del ORM y el esquema inicial.
- Crea `.env.example` sin secretos y agrega `.env` a `.gitignore`.
- Comprueba que las variables requeridas tengan nombres y propósitos claros.

**Resultado:** herramientas instaladas y configuración local segura, sin secretos en Git.

### 5. Implementar persistencia

- Define modelos, relaciones, restricciones e índices.
- Valida y formatea el esquema antes de conectarte a una base real.
- Crea migraciones con nombres que expliquen el cambio.
- Ejecuta las migraciones en una base de desarrollo.
- Crea un seed repetible con datos ficticios y credenciales documentadas.

**Resultado:** una base creada desde migraciones y datos de ejemplo recreables.

### 6. Implementar backend por casos de uso

Para cada feature:

1. Define el esquema de entrada con Zod.
2. Verifica sesión y permisos en el handler, aunque exista protección de páginas.
3. Implementa una función de dominio con una responsabilidad clara.
4. Accede a la base por Prisma.
5. Devuelve una respuesta consistente y códigos HTTP apropiados.
6. Comprueba errores de validación, permisos, datos inexistentes y conflictos.

Implementa primero los flujos críticos de negocio. Para operaciones concurrentes, piensa qué debe ocurrir si dos solicitudes leen y modifican el mismo registro al tiempo.

**Resultado:** APIs que cumplen las reglas aunque se llamen sin usar la interfaz.

### 7. Implementar interfaz y navegación

- Crea layouts y componentes compartidos antes de duplicarlos en cada página.
- Conecta un flujo completo a la vez: formulario, petición, respuesta, error y estado de carga.
- Aplica la estrategia de renderizado adecuada a los datos de cada página.
- Revisa accesibilidad básica, diseño móvil e imágenes.
- Agrega estados vacíos, errores y confirmaciones para las acciones importantes.

**Resultado:** flujos utilizables de principio a fin, no solo pantallas estáticas.

### 8. Seguridad, calidad y entrega

- Revisa autenticación, autorización, validaciones, privacidad y manejo de secretos.
- Ejecuta lint, chequeo de tipos, build y las pruebas que correspondan.
- Comprueba el proyecto desde una instalación limpia siguiendo el README.
- Prepara Docker/CI si forman parte del alcance.
- Despliega primero la base y luego la aplicación; valida los flujos en el entorno desplegado.
- Actualiza el README con variables, comandos, seed, scripts, estructura y URL real.

**Resultado:** otra persona puede instalar, ejecutar y verificar el proyecto siguiendo la documentación.

## Bitácora de BidHub

Estados: **Completo** significa ejecutado y comprobado; **En curso** significa que ya empezó; **Pendiente** significa que todavía no se implementa.

| Etapa | Estado | Qué incluye |
|---|---|---|
| 1. Leer requisitos e inspeccionar arquitectura | Completo | Leído `docs/.md`; revisadas las instrucciones y la estructura existente por features. |
| 2. Preparar Prisma 7 y Zod | Completo | Dependencias instaladas; `prisma/schema.prisma` y `prisma7.config.ts` creados por `prisma init`. |
| 3. Modelar datos y validar esquema | Completo | Modelos de usuarios, sesiones, categorías, subastas y ofertas escritos, formateados y validados con `npx prisma validate`. |
| 4. Conectar PostgreSQL y crear migración | Completo | `DATABASE_URL` configurado localmente; esquema validado; migración `init` aplicada y tablas visibles en Supabase. |
| 5. Implementar autenticación | Pendiente | Registro, login, refresh, logout, hash de contraseñas y cookies seguras. |
| 6. Implementar backend por features | En curso | `GET /api/categories` consulta PostgreSQL; esquemas Zod de registro/login creados y chequeo de tipos completado. |
| 7. Completar páginas y layouts | En curso | Rutas tienen componentes provisionales y pasan el chequeo de tipos; el contenido funcional y los layouts siguen pendientes. |
| 8. Agregar idiomas y detalles de UX | Pendiente | Español/inglés, selector, cuenta regresiva, responsive e imágenes. |
| 9. Seed, documentación y contenedores | Pendiente | Datos de ejemplo, `.env.example`, README, Dockerfile y opcionalmente Compose/CI. |
| 10. Verificar y desplegar | Pendiente | Calidad local, ejecución desde cero, Supabase y Vercel. |

### Paso actual: preparar autenticación

Archivos de referencia: `src/features/auth/schemas.ts` para validar registro/login y `src/lib/db.ts` para acceso a PostgreSQL.

La consulta `GET /api/categories` ya se probó en `http://localhost:3000/api/categories` y respondió `{ "data": [] }`, confirmando que Next.js puede consultar la base vacía.

Las páginas `page.tsx` que se crearon como estructura necesitan exportar un componente React por defecto. Los componentes provisionales sirven para validar el sistema de rutas; se reemplazarán por las pantallas funcionales en la etapa de interfaz.

### Referencia de conexión PostgreSQL

Archivo de configuración: `prisma7.config.ts`. Lee `DATABASE_URL` desde `.env`.

En Supabase, abrir el proyecto y seleccionar **Connect → Session pooler**. Para desarrollo local y migraciones se usa la cadena de sesión (puerto `5432`), especialmente si la red local no tiene IPv6. Guardarla en `.env` como `DATABASE_URL`, sin compartirla ni copiarla en `.env.example`. Validar el esquema con `npx prisma validate` antes de crear una migración. Crear/aplicar la migración de desarrollo con `npx prisma migrate dev --name init` y generar el cliente explícitamente con `npx prisma generate`.

Cuando la app se despliegue en Vercel, revisar la conexión de runtime: las funciones serverless usan el pooler de transacciones (puerto `6543`); Prisma recomienda separar esa URL de la URL usada por migraciones. Se documentará al preparar el despliegue.

### Referencia del esquema de Prisma

Archivo de trabajo: `prisma/schema.prisma`.

Al definir cada modelo, pregunta:

- ¿Qué representa y qué datos necesita?
- ¿Qué campos deben ser únicos o no nulos?
- ¿Qué relaciones tiene y qué pasa al borrar el registro relacionado?
- ¿Qué consultas frecuentes necesitan índices?
- ¿Es información sensible que no debe salir en una respuesta pública?

Después de editar el esquema, ejecutar:

```bash
npx prisma format
```

El formato correcto no significa que ya se hayan creado tablas. La siguiente etapa será configurar PostgreSQL y crear una migración. No uses `db push` como sustituto de migraciones en este proyecto.

## Notas de decisiones

- BidHub usa Next.js 16, TypeScript, PostgreSQL, Prisma ORM 7 y Zod.
- Prisma ORM 7 requiere configurar la URL de conexión en su archivo de configuración; este repositorio generó `prisma7.config.ts`.
- Los tokens de refresh se guardan como hash en la base de datos; las contraseñas también se guardan hasheadas.
- Esta guía se actualizará conforme se completen y verifiquen las etapas; los pasos pendientes no son instrucciones para ejecutar todavía.
