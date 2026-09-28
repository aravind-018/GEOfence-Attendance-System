import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { comparePassword, setSessionCookie, hashPassword } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";

async function ensureInitialSeed() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      console.log("Empty database detected on login attempt. Seeding initial admin and demo data...");
      const adminPasswordHash = await hashPassword("Admin@123");
      const employeePasswordHash = await hashPassword("Employee@123");

      // Create Admin
      await prisma.user.create({
        data: {
          email: "admin@geopresence.com",
          passwordHash: adminPasswordHash,
          role: "ADMIN",
          active: true,
        },
      });

      // Create Departments
      const deptEngineering = await prisma.department.create({
        data: { name: "Engineering", organization: "GEOPresence Corp", status: "ACTIVE" },
      });
      const deptHR = await prisma.department.create({
        data: { name: "Human Resources", organization: "GEOPresence Corp", status: "ACTIVE" },
      });

      // Create Employee
      const empUser = await prisma.user.create({
        data: {
          email: "rahul@geopresence.com",
          passwordHash: employeePasswordHash,
          role: "EMPLOYEE",
          active: true,
        },
      });

      await prisma.employee.create({
        data: {
          employeeId: "EMP001",
          userId: empUser.id,
          name: "Rahul Sharma",
          departmentId: deptEngineering.id,
          organization: "GEOPresence Corp",
          email: "rahul@geopresence.com",
          mobileNumber: "9876543210",
          status: "ACTIVE",
        },
      });

      // Create Workplace & QR Code
      const workplace = await prisma.workplace.create({
        data: {
          name: "HQ Tech Park",
          latitude: 12.971598,
          longitude: 77.594562,
          radiusMeters: 100.0,
          maxGpsAccuracyMeters: 100.0,
          status: "ACTIVE",
        },
      });

      await prisma.workplaceQRCode.create({
        data: {
          workplaceId: workplace.id,
          token: "sample-qr-token-hq-tech-park-2026",
          active: true,
        },
      });

      console.log("Auto-seeding complete!");
    }
  } catch (err) {
    console.error("Auto-seed error:", err);
  }
}

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

    // Check if database needs initial seed
    await ensureInitialSeed();

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
