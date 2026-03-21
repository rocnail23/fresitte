<div align="center">

# Fresitte · Moda infantil con amor

Ecommerce para una boutique infantil que combina colecciones cápsula, panel administrativo privado y checkout vía WhatsApp.

</div>

## Tech stack

- **Next.js 16 App Router** + React 19.
- **Tailwind v4 + shadcn/ui** para el sistema de diseño.
- **Drizzle ORM** sobre **Turso (libSQL)**.
- **Auth.js (NextAuth v4)** para autenticar únicamente al rol `admin`.
- **Cloudflare R2** para media (S3-compatible).
- **React Query + Zustand (cart)** lado cliente.
- **WhatsApp checkout**: genera mensaje preformateado con los ítems del carrito.

## Requerimientos previos

1. Node.js 20+.
2. Cuenta Turso + bucket R2.
3. Número de WhatsApp destinado a pedidos.
4. Archivo `.env` basado en `example.env`.

## Variables de entorno

```
DATABASE_URL=
DATABASE_AUTH_TOKEN=
AUTH_SECRET=
AUTH_ADMIN_EMAIL=
AUTH_ADMIN_PASSWORD=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL= # opcional si usas dominio propio; si no, se usa el endpoint público de R2
WHATSAPP_NUMBER=
```

## Scripts útiles

```bash
# Desarrollo
npm run dev

# Drizzle / Turso
npm run db:generate
npm run db:migrate
npm run db:studio

# Lint
npm run lint
```

## Flujo general

1. Crea la BD en Turso, copia `DATABASE_URL` y `DATABASE_AUTH_TOKEN`.
2. Ejecuta `npm run db:generate` y `npm run db:migrate` para crear las tablas (`db/schema.ts`).
3. Ejecuta un seed manual para el usuario admin (pendiente de script).
4. Levanta el entorno con `npm run dev`.
5. Configura Cloudflare R2 y actualiza las credenciales para las cargas de imágenes.
   - Bucket público con permisos `Read` para objetos.
   - Llave API scoped al bucket (Access Key + Secret).
   - Opcional: Worker/custom domain para servir media → define `R2_PUBLIC_BASE_URL`.
6. Personaliza `WHATSAPP_NUMBER` para pruebas de checkout.

## Subidas de imágenes (Cloudflare R2)

1. Completa las variables `R2_*` del `.env` y reinicia `npm run dev`.
2. Desde `/admin/categories` o `/admin/products`, selecciona un archivo en el campo de imagen antes de guardar.
3. La Server Action sube el archivo a R2 usando `@aws-sdk/client-s3` y guarda la URL resultante en Turso.
4. El catálogo público (`/`) leerá la URL desde la metadata y mostrará la imagen sin pasos extra.
5. Si la subida falla, se aborta la creación y el formulario mostrará el error genérico (“No pudimos subir…”); revisa la consola para ver el detalle.

## Próximos módulos

- Panel administrativo (`/admin`) para crear categorías y productos.
- Carrito persistente (Zustand + server sync) y validación de stock antes de WhatsApp.
- Subida de imágenes a R2 desde Server Actions.
- Seed & scripts CLI para provisioning (admin user, categorías base).
# fresitte
