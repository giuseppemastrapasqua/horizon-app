import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  createFinanceFormula,
  type CreateFormulaPayload,
  validateCreateFormulaPayload,
} from "@/lib/finance/service/create-finance-formula";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const includeRules =
    new URL(request.url).searchParams.get(
      "includeRules"
    ) === "true";

  try {
    const formulas = includeRules
      ? await prisma.financeFormula.findMany({
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

            rules: {
              orderBy: {
                order: "asc",
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
          },
        })
      : await prisma.financeFormula.findMany({
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
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
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
      {
        status: 400,
      }
    );
  }

  const validationError =
    validateCreateFormulaPayload(payload);

  if (validationError) {
    return NextResponse.json(
      {
        error: validationError,
      },
      {
        status: 400,
      }
    );
  }

  try {
    const formula =
      await createFinanceFormula(
        payload as CreateFormulaPayload
      );

    if (!formula) {
      return NextResponse.json(
        {
          error:
            "La proprietà selezionata non esiste.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        formula,
      },
      {
        status: 201,
      }
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
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Errore interno del server.",
      },
      {
        status: 500,
      }
    );
  }
}