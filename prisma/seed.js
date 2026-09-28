const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Checking database seed...");

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("ℹ️ Users already exist in database. Skipping seed.");
    return;
  }

  console.log("🚀 Empty database detected. Seeding initial admin and demo data...");

  // Hash default passwords
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const employeePasswordHash = await bcrypt.hash("Employee@123", 10);

  // 1. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@geopresence.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      active: true,
    },
  });
  console.log(`✅ Admin created: admin@geopresence.com / Admin@123 (ID: ${adminUser.id})`);

  // 2. Create Departments
  const deptEngineering = await prisma.department.create({
    data: {
      name: "Engineering",
      organization: "GEOPresence Corp",
      status: "ACTIVE",
    },
  });

  const deptHR = await prisma.department.create({
    data: {
      name: "Human Resources",
      organization: "GEOPresence Corp",
      status: "ACTIVE",
    },
  });

  // 3. Create 5 Employees
  const employeesData = [
    {
      employeeId: "EMP001",
      name: "Rahul Sharma",
      email: "rahul@geopresence.com",
      mobileNumber: "9876543210",
      departmentId: deptEngineering.id,
    },
    {
      employeeId: "EMP002",
      name: "Priya Patel",
      email: "priya@geopresence.com",
      mobileNumber: "9876543211",
      departmentId: deptEngineering.id,
    },
    {
      employeeId: "EMP003",
      name: "Amit Kumar",
      email: "amit@geopresence.com",
      mobileNumber: "9876543212",
      departmentId: deptEngineering.id,
    },
    {
      employeeId: "EMP004",
      name: "Sneha Gupta",
      email: "sneha@geopresence.com",
      mobileNumber: "9876543213",
      departmentId: deptHR.id,
    },
    {
      employeeId: "EMP005",
      name: "Vikram Singh",
      email: "vikram@geopresence.com",
      mobileNumber: "9876543214",
      departmentId: deptHR.id,
    },
  ];

  for (const emp of employeesData) {
    const user = await prisma.user.create({
      data: {
        email: emp.email,
        passwordHash: employeePasswordHash,
        role: "EMPLOYEE",
        active: true,
      },
    });

    await prisma.employee.create({
      data: {
        employeeId: emp.employeeId,
        userId: user.id,
        name: emp.name,
        departmentId: emp.departmentId,
        organization: "GEOPresence Corp",
        email: emp.email,
        mobileNumber: emp.mobileNumber,
        status: "ACTIVE",
      },
    });
  }

  // 4. Create Workplace & QR Code
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

  const qrToken = "sample-qr-token-hq-tech-park-2026";
  await prisma.workplaceQRCode.create({
    data: {
      workplaceId: workplace.id,
      token: qrToken,
      active: true,
    },
  });

  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
