import { prisma } from "@/lib/prisma";

type FindOrCreateGuestInput = {
  fullName: string;
  email?: string | null;
  phone?: string | null;
};

export async function findOrCreateGuest({
  fullName,
  email,
  phone,
}: FindOrCreateGuestInput) {
  const normalizedName = normalizeName(fullName);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedName) {
    throw new Error("Il nome dell'ospite è obbligatorio.");
  }

  const existingGuest = await findExistingGuest({
    fullName: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
  });

  if (existingGuest) {
    return {
      guest: existingGuest,
      created: false,
    };
  }

  const guest = await prisma.guest.create({
    data: {
      fullName: fullName.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
    },
  });

  return {
    guest,
    created: true,
  };
}

async function findExistingGuest({
  fullName,
  email,
  phone,
}: {
  fullName: string;
  email: string | null;
  phone: string | null;
}) {
  if (email) {
    const guestByEmail = await prisma.guest.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (guestByEmail) {
      return guestByEmail;
    }
  }

  if (phone) {
    const guestsWithPhone = await prisma.guest.findMany({
      where: {
        phone: {
          not: null,
        },
      },
    });

    const guestByPhone = guestsWithPhone.find(
      (guest) =>
        normalizePhone(guest.phone) === phone
    );

    if (guestByPhone) {
      return guestByPhone;
    }
  }

  return prisma.guest.findFirst({
    where: {
      fullName: {
        equals: fullName,
        mode: "insensitive",
      },
      email: email
        ? {
            equals: email,
            mode: "insensitive",
          }
        : null,
      phone: phone ?? null,
    },
  });
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase();

  return normalized || null;
}

function normalizePhone(value?: string | null) {
  const normalized = value?.replace(/\D/g, "");

  return normalized || null;
}