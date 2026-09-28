import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { comparePassword, setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, role } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "Account is inactive. Please contact your administrator." },
        { status: 403 }
      );
    }

    // Role check if specified
    if (role && user.role !== role) {
      return NextResponse.json(
        { error: `Unauthorized role access. Account is registered as ${user.role}.` },
        { status: 403 }
      );
    }

    // Employee status check
    if (user.role === "EMPLOYEE" && user.employee && user.employee.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Employee profile is inactive. Please contact HR." },
        { status: 403 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Set secure HTTP-only cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.employeeId,
      name: user.employee?.name || "Admin",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.employee?.name || "Administrator",
        employeeId: user.employee?.employeeId,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred during login." },
      { status: 500 }
    );
  }
}
