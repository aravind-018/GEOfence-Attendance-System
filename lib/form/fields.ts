import { prisma } from "@/lib/db/prisma";

export const DEFAULT_FORM_FIELDS = [
  {
    label: "Full Name",
    key: "fullName",
    type: "TEXT",
    placeholder: "Enter your full name",
    helpText: "Provide your official full name",
    required: true,
    active: true,
    displayOrder: 1,
    isDefault: true,
  },
  {
    label: "Email Address",
    key: "email",
    type: "EMAIL",
    placeholder: "name@example.com",
    helpText: "Provide your active email address",
    required: true,
    active: true,
    displayOrder: 2,
    isDefault: true,
  },
  {
    label: "Mobile Number",
    key: "mobileNumber",
    type: "PHONE",
    placeholder: "e.g. 9876543210",
    helpText: "Contact mobile number",
    required: true,
    active: true,
    displayOrder: 3,
    isDefault: true,
  },
  {
    label: "Department",
    key: "departmentName",
    type: "TEXT",
    placeholder: "e.g. Engineering, Sales, HR",
    helpText: "Your department or unit",
    required: true,
    active: true,
    displayOrder: 4,
    isDefault: true,
  },
  {
    label: "Organization",
    key: "organization",
    type: "TEXT",
    placeholder: "e.g. GEOPresence Corp",
    helpText: "Your company, institution, or organization name",
    required: false,
    active: true,
    displayOrder: 5,
    isDefault: true,
  },
  {
    label: "Employee ID / Visitor ID",
    key: "employeeCode",
    type: "TEXT",
    placeholder: "Optional ID number",
    helpText: "Organization employee code or visitor badge ID",
    required: false,
    active: true,
    displayOrder: 6,
    isDefault: true,
  },
];

/**
 * Ensures a workplace has form fields configured.
 * If no fields exist for the workplace, seeds default form fields.
 */
export async function getOrCreateWorkplaceFormFields(workplaceId: string) {
  const existingFields = await prisma.formField.findMany({
    where: { workplaceId },
    orderBy: { displayOrder: "asc" },
  });

  if (existingFields.length > 0) {
    return existingFields;
  }

  // Create default fields for this workplace
  const createdFields = [];
  for (const field of DEFAULT_FORM_FIELDS) {
    const created = await prisma.formField.create({
      data: {
        ...field,
        workplaceId,
      },
    });
    createdFields.push(created);
  }

  return createdFields;
}

/**
 * Converts a label into a clean, stable internal key (e.g., "Purpose of Visit" -> "purposeOfVisit")
 */
export function generateFieldKey(label: string): string {
  const clean = label
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    .replace(/\s+/g, "");

  if (!clean) return `field_${Date.now()}`;
  return clean.charAt(0).toLowerCase() + clean.slice(1);
}
