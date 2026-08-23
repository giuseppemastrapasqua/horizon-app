import {
  FinanceFormulaScope,
  Prisma,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  createFinanceFormula,
  type CreateFormulaPayload,
  validateCreateFormulaPayload,
} from "@/lib/finance/service/create-finance-formula";
import { getAccessiblePropertyIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const GLOBAL_ROLES = [
  "SUPER_ADMIN",
  "MANAGER",
  "FINANCE_ADMIN",
];

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Accesso non autorizzato." },
      { status: 401 },
    );
  }

  const includeRules =
    new URL(request.url).searchParams.get(
      "includeRules",
    ) === "true";

  try {
    const ids =
      await getAccessiblePropertyIds();

    const where = ids
      ? {
          OR: [
            { propertyId: null },
            {
              propertyId: {
                in: ids,
              },
            },
          ],
        }
      : undefined;

    const formulas =
      await prisma.financeFormula.findMany({
        where,
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          scope: true,
          propertyId: true,
          name: true,
          description: true,
          status: true,
          ...(includeRules
            ? {
                rules: {
                  orderBy: {
                    order: "asc" as const,
                  },
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    order: true,
                    isEnabled: true,
                    operation: true,
                    valueType: true,
                    value: true,
                    base: true,
                    referencedFormulaId: true,
                  },
                },
              }
            : {}),
        },
      });

    return NextResponse.json({
      formulas,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Non è stato possibile caricare le formule.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Accesso non autorizzato." },
      { status: 401 },
    );
  }

  let payload: Partial<CreateFormulaPayload>;

  try {
    payload =
      (await request.json()) as Partial<CreateFormulaPayload>;
  } catch {
    return NextResponse.json(
      {
        error:
          "Il corpo della richiesta non è valido.",
      },
      { status: 400 },
    );
  }

  const validationError =
    validateCreateFormulaPayload(payload);

  if (validationError) {
    return NextResponse.json(
      { error: validationError },
      { status: 400 },
    );
  }

  const data =
    payload as CreateFormulaPayload;

  if (
    data.scope ===
    FinanceFormulaScope.ALL_PROPERTIES
  ) {
    if (
      !GLOBAL_ROLES.includes(
        session.user.role,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Operazione non autorizzata.",
        },
        { status: 403 },
      );
    }
  } else {
    const ids =
      await getAccessiblePropertyIds();

    if (
      ids &&
      (!data.propertyId ||
        !ids.includes(data.propertyId))
    ) {
      return NextResponse.json(
        {
          error:
            "Accesso alla struttura non autorizzato.",
        },
        { status: 403 },
      );
    }
  }

  try {
    const formula =
      await createFinanceFormula(data);

    if (!formula) {
      return NextResponse.json(
        {
          error:
            "La proprietà selezionata non esiste.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { formula },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      return NextResponse.json(
        {
          error:
            "Non è stato possibile creare la formula.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Errore interno del server.",
      },
      { status: 500 },
    );
  }
}
