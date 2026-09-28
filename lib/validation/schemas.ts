import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
});

export const employeeCreateSchema = z.object({
  employeeId: z.string().min(2, "Employee ID must be at least 2 characters"),
  name: z.string().min(2, "Full name is required"),
  departmentId: z.string().uuid("Valid department is required"),
  organization: z.string().default("GEOPresence Corp"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const employeeUpdateSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  departmentId: z.string().uuid("Valid department is required"),
  organization: z.string().min(1, "Organization is required"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  organization: z.string().min(1, "Organization is required").default("GEOPresence Corp"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const workplaceSchema = z.object({
  name: z.string().min(2, "Workplace name is required"),
  latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  radiusMeters: z.number().positive("Radius must be positive").default(100),
  maxGpsAccuracyMeters: z.number().positive("Max accuracy must be positive").default(100),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const checkInSchema = z.object({
  token: z.string().min(1, "QR token is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  gpsAccuracyMeters: z.number().nonnegative(),
});

export const validateLocationSchema = z.object({
  token: z.string().min(1, "QR token is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  gpsAccuracyMeters: z.number().nonnegative(),
});
