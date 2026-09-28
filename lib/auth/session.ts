import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { UserSessionPayload, AuthenticatedUser } from "./types";

const COOKIE_NAME = "geo_session";
const SECRET_KEY = process.env.AUTH_SECRET || "dev-secret-key-geofence-attendance-system-2026";
const key = new TextEncoder().encode(SECRET_KEY);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as UserSessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(payload: UserSessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getSession();
  if (!session?.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user || !user.active) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      active: user.active,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeId: user.employee.employeeId,
            name: user.employee.name,
            departmentId: user.employee.departmentId,
            departmentName: user.employee.department.name,
            organization: user.employee.organization,
            email: user.employee.email,
            mobileNumber: user.employee.mobileNumber,
            status: user.employee.status,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}
