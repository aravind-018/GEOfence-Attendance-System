export type UserRole = "ADMIN" | "EMPLOYEE";

export interface UserSessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  name?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  employee?: {
    id: string;
    employeeId: string;
    name: string;
    departmentId: string;
    departmentName: string;
    organization: string;
    email: string;
    mobileNumber: string;
    status: string;
  };
}
