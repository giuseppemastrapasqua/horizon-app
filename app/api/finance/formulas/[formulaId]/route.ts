import {
  AuditAction,
  FinanceFormulaScope,
  Prisma,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAccessiblePropertyIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

import {
  updateFinanceFormula,
  validateUpdateFormulaPayload,
  type UpdateFormulaPayload,
} from "@/lib/finance/service/update-finance-formula";

type RouteContext = {
  params: Promise<{
    formulaId: string;
  }>;
};

const GLOBAL_FORMULA_ROLES = [
  "SUPER_ADMIN",
  "MANAGER",
  "FINANCE_ADMIN",
];

function hasGlobalFormulaAccess(
  role: string,
): boolean {
  return GLOBAL_FORMULA_ROLES.includes(
    role,
  );
}

function hasPropertyFormulaAccess(
  propertyId: string | null,
  accessiblePropertyIds: string[] | null,
): boolean {
  if (!propertyId) {
    return false;
  }

  return (
    accessiblePropertyIds === null ||
    accessiblePropertyIds.includes(
      propertyId,
    )
  );
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Accesso non autorizzato." },
      { status: 401 },
    );
  }

  const { formulaId } = await context.params;

  if (!formulaId.trim()) {
    return NextResponse.json(
      {
        error:
          "L'identificativo della formula non è valido.",
      },
      { status: 400 },
    );
  }

  try {
    const formula =
      await prisma.financeFormula.findUnique({
        where: {
          id: formulaId,
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
      });

    if (!formula) {
      return NextResponse.json(
        {
          error:
            "La formula selezionata non esiste.",
        },
        { status: 404 },
      );
    }

    const accessiblePropertyIds =
      await getAccessiblePropertyIds();

    const authorized =
      formula.scope ===
      FinanceFormulaScope.ALL_PROPERTIES
        ? hasGlobalFormulaAccess(
            session.user.role,
          )
        : hasPropertyFormulaAccess(
            formula.propertyId,
            accessiblePropertyIds,
          );

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "Accesso alla formula non autorizzato.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      formula,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Non è stato possibile caricare la formula.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Accesso non autorizzato." },
      { status: 401 },
    );
  }

  const { formulaId } = await context.params;

  if (!formulaId.trim()) {
    return NextResponse.json(
      {
        error:
          "L'identificativo della formula non è valido.",
      },
      { status: 400 },
    );
  }

  let payload: Partial<UpdateFormulaPayload>;

  try {
    payload =
      (await request.json()) as Partial<UpdateFormulaPayload>;
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
    validateUpdateFormulaPayload(payload);

  if (validationError) {
    return NextResponse.json(
      { error: validationError },
      { status: 400 },
    );
  }

  const data =
    payload as UpdateFormulaPayload;

  try {
    const currentFormula =
      await prisma.financeFormula.findUnique({
        where: {
          id: formulaId,
        },
        select: {
          id: true,
          scope: true,
          propertyId: true,
        },
      });

    if (!currentFormula) {
      return NextResponse.json(
        {
          error:
            "La formula selezionata non esiste.",
        },
        { status: 404 },
      );
    }

    const accessiblePropertyIds =
      await getAccessiblePropertyIds();

    const canAccessCurrent =
      currentFormula.scope ===
      FinanceFormulaScope.ALL_PROPERTIES
        ? hasGlobalFormulaAccess(
            session.user.role,
          )
        : hasPropertyFormulaAccess(
            currentFormula.propertyId,
            accessiblePropertyIds,
          );

    if (!canAccessCurrent) {
      return NextResponse.json(
        {
          error:
            "Accesso alla formula non autorizzato.",
        },
        { status: 403 },
      );
    }

    const canAccessDestination =
      data.scope ===
      FinanceFormulaScope.ALL_PROPERTIES
        ? hasGlobalFormulaAccess(
            session.user.role,
          )
        : hasPropertyFormulaAccess(
            data.propertyId?.trim() ?? null,
            accessiblePropertyIds,
          );

    if (!canAccessDestination) {
      return NextResponse.json(
        {
          error:
            "Destinazione della formula non autorizzata.",
        },
        { status: 403 },
      );
    }

    const result =
      await updateFinanceFormula(
        formulaId,
        data,
        session.user.id,
      );

    if (
      result.status ===
      "FORMULA_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "La formula selezionata non esiste.",
        },
        { status: 404 },
      );
    }

    if (
      result.status ===
      "PROPERTY_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "La proprietà selezionata non esiste.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      formula: result.formula,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      return NextResponse.json(
        {
          error:
            "Non è stato possibile aggiornare la formula.",
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

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Accesso non autorizzato." },
      { status: 401 },
    );
  }

  const { formulaId } = await context.params;

  if (!formulaId.trim()) {
    return NextResponse.json(
      {
        error:
          "L'identificativo della formula non è valido.",
      },
      { status: 400 },
    );
  }

  try {
    const formula =
      await prisma.financeFormula.findUnique({
        where: {
          id: formulaId,
        },
        select: {
          id: true,
          propertyId: true,
          scope: true,
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
              order: true,
              isEnabled: true,
              operation: true,
              valueType: true,
              base: true,
              value: true,
              referencedFormulaId: true,
            },
          },
        },
      });

    if (!formula) {
      return NextResponse.json(
        {
          error:
            "La formula selezionata non esiste.",
        },
        { status: 404 },
      );
    }

    const accessiblePropertyIds =
      await getAccessiblePropertyIds();

    const authorized =
      formula.scope ===
      FinanceFormulaScope.ALL_PROPERTIES
        ? hasGlobalFormulaAccess(
            session.user.role,
          )
        : hasPropertyFormulaAccess(
            formula.propertyId,
            accessiblePropertyIds,
          );

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "Accesso alla formula non autorizzato.",
        },
        { status: 403 },
      );
    }

    await prisma.$transaction(
      async (transaction) => {
        await transaction.financeFormula.delete({
          where: {
            id: formula.id,
          },
        });

        await AuditService.log(
          {
            actorId:
              session.user.id,
            action: AuditAction.DELETE,
            propertyId:
              formula.propertyId,
            entityType:
              "FINANCE_FORMULA",
            entityId:
              formula.id,
            description:
              "Formula finanziaria eliminata.",
            metadata: {
              name: formula.name,
              description:
                formula.description,
              scope: formula.scope,
              status: formula.status,
              propertyId:
                formula.propertyId,
              rulesCount:
                formula.rules.length,
              rules:
                formula.rules.map(
                  (rule) => ({
                    id: rule.id,
                    name: rule.name,
                    order: rule.order,
                    isEnabled:
                      rule.isEnabled,
                    operation:
                      rule.operation,
                    valueType:
                      rule.valueType,
                    base:
                      rule.base,
                    value:
                      rule.value,
                    referencedFormulaId:
                      rule.referencedFormulaId,
                  }),
                ),
            },
          },
          transaction,
        );
      },
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      return NextResponse.json(
        {
          error:
            "Non è stato possibile eliminare la formula.",
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