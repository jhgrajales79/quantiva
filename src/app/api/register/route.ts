import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { newId } from "@/lib/id";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con este correo." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.insert(users).values({
    id: newId("user"),
    email,
    name: parsed.data.name,
    passwordHash,
    role: "user",
  });

  return NextResponse.json({ ok: true });
}
