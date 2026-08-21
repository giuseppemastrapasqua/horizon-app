const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const existingDefault =
    await prisma.financeReportTemplate.findFirst({
      where: {
        propertyId: null,
        isDefault: true,
      },
    });

  if (existingDefault) {
    console.log(
      "Template Horizon default già presente:",
      existingDefault.id
    );

    return;
  }

  const template =
    await prisma.financeReportTemplate.create({
      data: {
        propertyId: null,

        name:
          "Horizon Default",

        isDefault:
          true,

        headerTitle:
          "Rendiconto proprietario",

        primaryColor:
          "#2563EB",

        showBookingDetails:
          true,

        showOtaCommissions:
          true,

        showCleaningCosts:
          true,

        showManagementFees:
          true,

        showTaxes:
          true,

        showManualAdjustments:
          true,

        showCategorySummary:
          true,

        footerText:
          "Rendiconto generato da Horizon",
      },
    });

  console.log(
    "OK - template Horizon creato:",
    template.id
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
