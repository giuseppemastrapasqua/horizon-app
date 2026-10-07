import { notFound } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { WorkspaceTopBar } from "@/components/ui/WorkspaceTopBar";
import { getOwnerWorkspace } from "@/lib/owners/get-owner-workspace";
import { requireUser } from "@/lib/auth/guards";
import { OwnerHero } from "./components/OwnerHero";
import { OwnerKPIs } from "./components/OwnerKPIs";
import { OwnerProperties } from "./components/OwnerProperties";
import { OwnerTimeline } from "./components/OwnerTimeline";
import { OwnerDocuments } from "./components/OwnerDocuments";
import { OwnerQuickActions } from "./components/OwnerQuickActions";

type OwnerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OwnerDetailPage({
  params,
}: OwnerDetailPageProps) {
  const { id } = await params;

  const user = await requireUser();

  if (user.role === "OWNER" && user.id !== id) {
    notFound();
  }

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

        <div style={workspaceStyle}>
          <OwnerProperties properties={properties} />

          <OwnerQuickActions
            ownerId={owner.id}
            firstPropertyId={properties[0]?.id ?? null}
          />

          <OwnerDocuments
            ownerId={owner.id}
            documents={documents}
          />

          <OwnerTimeline items={timeline.slice(0, 4)} />
        </div>
      </AppShell>
    </>
  );
}

const workspaceStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 7fr) minmax(280px, 3fr)",
  gap: "24px",
  alignItems: "stretch",
};
