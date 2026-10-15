import { prisma } from "@/lib/prisma";
import { ownerTaskTypes } from "@/lib/owners/portal-policy";

export async function searchOwnerPortal(ids: string[], query: string) {
  const [properties, reports, tasks, invoices] = await Promise.all([
    prisma.property.findMany({
      where: {
        id: { in: ids },
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, name: true, city: true },
    }),
    prisma.financeReport.findMany({
      where: {
        propertyId: { in: ids },
        title: { contains: query, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, title: true },
    }),
    prisma.task.findMany({
      where: {
        propertyId: { in: ids },
        type: { in: [...ownerTaskTypes] },
        title: { contains: query, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, title: true },
    }),
    prisma.document.findMany({
      where: {
        propertyId: { in: ids },
        status: { in: ["FINAL", "ISSUED"] },
        type: "COMMISSION_INVOICE",
        title: { contains: query, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, title: true },
    }),
  ]);
  return [
    ...properties.map((item) => ({
      id: item.id,
      type: "PROPERTY",
      title: item.name,
      subtitle: item.city,
      href: `/calendar?propertyId=${item.id}`,
    })),
    ...reports.map((item) => ({
      id: item.id,
      type: "DOCUMENT",
      title: item.title,
      subtitle: "Rendiconto",
      href: `/reports/monthly/${item.id}`,
    })),
    ...tasks.map((item) => ({
      id: item.id,
      type: "TASK",
      title: item.title,
      subtitle: "Intervento",
      href: `/tasks/${item.id}`,
    })),
    ...invoices.map((item) => ({
      id: item.id,
      type: "DOCUMENT",
      title: item.title,
      subtitle: "Fattura",
      href: `/invoices/${item.id}/pdf`,
    })),
  ];
}
