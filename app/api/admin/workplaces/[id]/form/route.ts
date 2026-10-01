import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrCreateWorkplaceFormFields, generateFieldKey } from "@/lib/form/fields";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workplaceId } = await params;

    const workplace = await prisma.workplace.findUnique({ where: { id: workplaceId } });
    if (!workplace) {
      return NextResponse.json({ error: "Workplace not found" }, { status: 404 });
    }

    const formFields = await getOrCreateWorkplaceFormFields(workplaceId);
    return NextResponse.json({ formFields });
  } catch (error) {
    console.error("GET Form Fields Error:", error);
    return NextResponse.json({ error: "Failed to fetch form fields" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workplaceId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { label, type, placeholder, helpText, required, active, options } = body || {};

    if (!label || !type) {
      return NextResponse.json(
        { error: "Field Label and Field Type are required." },
        { status: 400 }
      );
    }

    // Generate internal key
    let key = generateFieldKey(label);

    // Ensure key uniqueness within workplace
    const existingKey = await prisma.formField.findFirst({
      where: { workplaceId, key },
    });

    if (existingKey) {
      key = `${key}_${Date.now()}`;
    }

    // Find max displayOrder
    const maxOrder = await prisma.formField.aggregate({
      where: { workplaceId },
      _max: { displayOrder: true },
    });

    const nextOrder = (maxOrder._max.displayOrder || 0) + 1;

    const field = await prisma.formField.create({
      data: {
        workplaceId,
        label,
        key,
        type: type.toUpperCase(),
        placeholder: placeholder || null,
        helpText: helpText || null,
        required: required !== false,
        active: active !== false,
        displayOrder: nextOrder,
        options: options || null,
        isDefault: false,
      },
    });

    return NextResponse.json({ success: true, field }, { status: 201 });
  } catch (error) {
    console.error("POST Form Field Error:", error);
    return NextResponse.json({ error: "Failed to create form field" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workplaceId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { fieldId, label, type, placeholder, helpText, required, active, options, displayOrder } = body || {};

    if (!fieldId) {
      return NextResponse.json({ error: "fieldId is required" }, { status: 400 });
    }

    const existing = await prisma.formField.findUnique({ where: { id: fieldId } });
    if (!existing || existing.workplaceId !== workplaceId) {
      return NextResponse.json({ error: "Form field not found" }, { status: 404 });
    }

    const updatedField = await prisma.formField.update({
      where: { id: fieldId },
      data: {
        label: label !== undefined ? label : existing.label,
        type: type !== undefined ? type.toUpperCase() : existing.type,
        placeholder: placeholder !== undefined ? placeholder : existing.placeholder,
        helpText: helpText !== undefined ? helpText : existing.helpText,
        required: required !== undefined ? required : existing.required,
        active: active !== undefined ? active : existing.active,
        options: options !== undefined ? options : existing.options,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
      },
    });

    return NextResponse.json({ success: true, field: updatedField });
  } catch (error) {
    console.error("PATCH Form Field Error:", error);
    return NextResponse.json({ error: "Failed to update form field" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workplaceId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const fieldId = searchParams.get("fieldId");

    if (!fieldId) {
      return NextResponse.json({ error: "fieldId query parameter is required" }, { status: 400 });
    }

    const existing = await prisma.formField.findUnique({ where: { id: fieldId } });
    if (!existing || existing.workplaceId !== workplaceId) {
      return NextResponse.json({ error: "Form field not found" }, { status: 404 });
    }

    // Soft-delete or deactivate if it's a default field, or delete record while retaining historical submissions in Attendance.formData
    await prisma.formField.delete({ where: { id: fieldId } });

    return NextResponse.json({ success: true, message: "Field deleted" });
  } catch (error) {
    console.error("DELETE Form Field Error:", error);
    return NextResponse.json({ error: "Failed to delete form field" }, { status: 500 });
  }
}
