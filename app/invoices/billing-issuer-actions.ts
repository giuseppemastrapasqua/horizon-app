"use server";

import { z } from "zod";

import { requireRoles } from "@/lib/auth/guards";
import { uploadBillingIssuerLogo } from "@/lib/invoices/upload-billing-issuer-logo";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  businessName: z.string().trim().min(2).max(160),
  vatNumber: z.string().trim().min(2).max(32),
  taxCode: z.string().trim().max(32).optional(),
  address: z.string().trim().min(2).max(200),
  postalCode: z.string().trim().min(2).max(20),
  city: z.string().trim().min(2).max(120),
  province: z.string().trim().max(80).optional(),
  country: z.string().trim().length(2),
  email: z.string().trim().email(),
  pec: z.union([z.string().trim().email(), z.literal("")]).optional(),
});

export async function upsertBillingIssuerProfileAction(formData: FormData) {
  await requireRoles(["SUPER_ADMIN"]);

  const data = schema.parse({
    businessName: formData.get("businessName"),
    vatNumber: formData.get("vatNumber"),
    taxCode: formData.get("taxCode"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    province: formData.get("province"),
    country: formData.get("country"),
    email: formData.get("email"),
    pec: formData.get("pec"),
  });


  const logoFile = formData.get("logo");
  const uploadedLogo =
    logoFile instanceof File && logoFile.size > 0
      ? await uploadBillingIssuerLogo(logoFile)
      : null;

  const values = {
    businessName: data.businessName,
    vatNumber: data.vatNumber.toUpperCase(),
    taxCode: data.taxCode?.toUpperCase() || null,
    address: data.address,
    postalCode: data.postalCode,
    city: data.city,
    province: data.province?.toUpperCase() || null,
    country: data.country.toUpperCase(),
    email: data.email.toLowerCase(),
    pec: data.pec?.toLowerCase() || null,
    ...(uploadedLogo ? { logoPath: uploadedLogo.url } : {}),
  };

  await prisma.billingIssuerProfile.upsert({
    where: { profileKey: "DEFAULT" },
    create: { profileKey: "DEFAULT", ...values },
    update: values,
  });

  return { success: true };
}
