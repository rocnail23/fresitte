import { cache } from "react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth.config";

export const getSession = cache(() => getServerSession(authOptions));

export const getCurrentUser = async () => {
  const session = await getSession();
  return session?.user ?? null;
};

export const requireAdmin = async () => {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Acceso no autorizado");
  }
  return user;
};
