import { notFound } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { getOwnerWorkspace } from "@/lib/owners/get-owner-workspace";
import { OwnerHero } from "./components/OwnerHero";
import { OwnerKPIs } from "./components/OwnerKPIs";
import { OwnerProperties } from "./components/OwnerProperties";
import { OwnerTimeline } from "./components/OwnerTimeline";
import { OwnerDocuments } from "./components/OwnerDocuments";
import { OwnerQuickActions } from "./components/OwnerQuickActions";
import { WorkspaceGrid } from "@/components/ui/WorkspaceGrid";
import { WorkspaceTopBar } from "@/components/ui/WorkspaceTopBar";

type OwnerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OwnerDetailPage({
  params,
}: OwnerDetailPageProps) {
  const { id } = await params;

  const workspace = await getOwnerWorkspace(id);

  if (!workspace) {
    notFound();
  }

 const {
  owner,
  metrics,
  properties,
  documents,
  timeline,
} = workspace;

  return (
    <>
      <Navigation />

      <AppShell
        title={owner.fullName}
        subtitle="Workspace proprietario e controllo completo del portfolio."
      >
     <WorkspaceTopBar
  backLabel="Torna ai proprietari"
  backHref="/owners"
  actions={
    <>
      <ActionButton
        label="Report mensile"
        href={`/reports/monthly?ownerId=${owner.id}`}
      />

      <ActionButton
        label="Archivio documenti"
        href={`/documents?ownerId=${owner.id}`}
        variant="secondary"
      />
    </>
  }
/>

        <OwnerHero
          owner={owner}
          propertiesCount={metrics.propertiesCount}
          futureBookingsCount={metrics.futureBookingsCount}
          openTasksCount={metrics.openTasksCount}
          operationalAlertsCount={metrics.operationalAlertsCount}
          averageScore={metrics.averageScore}
        />

        <OwnerKPIs
          totalRevenue={metrics.totalRevenue}
          currentMonthRevenue={metrics.currentMonthRevenue}
          propertiesCount={metrics.propertiesCount}
          futureBookingsCount={metrics.futureBookingsCount}
          currentBookingsCount={metrics.currentBookingsCount}
          openTasksCount={metrics.openTasksCount}
          operationalAlertsCount={metrics.operationalAlertsCount}
          documentsCount={metrics.documentsCount}
        />

        <WorkspaceGrid
  left={
    <>
      <OwnerProperties properties={properties} />

      <OwnerDocuments
        ownerId={owner.id}
        documents={documents}
      />
    </>
  }
  right={
    <>
      <OwnerTimeline items={timeline} />

      <OwnerQuickActions
        ownerId={owner.id}
        firstPropertyId={properties[0]?.id ?? null}
      />
    </>
  }
/>
      </AppShell>
    </>
  );
}
