import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url({ message: "DATABASE_URL debe ser una URL válida" }),
  DATABASE_AUTH_TOKEN: z.string().min(1, "DATABASE_AUTH_TOKEN es requerido"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET es requerido"),
  AUTH_ADMIN_EMAIL: z.string().email().optional(),
  AUTH_ADMIN_PASSWORD: z.string().min(8).optional(),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID es requerido"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID es requerido"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY es requerido"),
  R2_BUCKET: z.string().min(1, "R2_BUCKET es requerido"),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  WHATSAPP_NUMBER: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Configuración de entorno inválida", parsed.error.format());
  throw new Error("No se pudo iniciar la aplicación: variables de entorno incompletas");
}

export const env = parsed.data;
