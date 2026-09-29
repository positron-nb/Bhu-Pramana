import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RoleSchema, type Role } from "@/lib/domain/schemas";
import { can, ROLE_COOKIE, type Permission } from "@/lib/roles";

/** Shared helpers for /api/v1 route handlers. */

export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,x-demo-role",
};

export function json(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, { ...init, headers: { ...CORS, ...(init.headers ?? {}) } });
}

export function problem(status: number, title: string, detail?: unknown) {
  return NextResponse.json({ type: "about:blank", title, status, detail }, { status, headers: { ...CORS, "content-type": "application/problem+json" } });
}

/** Demo role from header (API clients) or cookie (browser session). */
export async function requestRole(req: Request): Promise<Role | null> {
  const header = req.headers.get("x-demo-role");
  const jar = await cookies();
  const raw = header ?? jar.get(ROLE_COOKIE)?.value ?? null;
  const parsed = RoleSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function requirePermission(req: Request, p: Permission) {
  const role = await requestRole(req);
  if (!can(role, p)) return { role, error: problem(403, "Forbidden", `This action requires the “${p}” permission. Current demo role: ${role ?? "none"}. Send header x-demo-role.`) };
  return { role, error: null };
}
