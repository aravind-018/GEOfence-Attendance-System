-- DropIndex
DROP INDEX IF EXISTS "attendances_employeeId_date_key";

-- AlterTable
ALTER TABLE "attendances" ALTER COLUMN "employeeId" DROP NOT NULL,
ADD COLUMN     "departmentName" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "employeeCode" TEXT,
ADD COLUMN     "formData" JSONB,
ADD COLUMN     "mobileNumber" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "organization" TEXT;

-- CreateTable
CREATE TABLE "form_fields" (
    "id" TEXT NOT NULL,
    "workplaceId" TEXT,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
