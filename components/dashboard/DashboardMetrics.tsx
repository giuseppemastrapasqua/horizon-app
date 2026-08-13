import { MetricCard } from "@/components/ui/MetricCard";
import { uiTokens } from "@/components/ui/tokens";

type DashboardMetricsProps = {
  metrics: {
    checkInsToday: number;
    checkOutsToday: number;
    openTasks: number;
    overdueTasks: number;
    pendingEvents: number;
    failedEvents: number;
    queuedBackgroundJobs: number;
    runningBackgroundJobs: number;
    completedBackgroundJobs: number;
    failedBackgroundJobs: number;
  };
};

export function DashboardMetrics({
  metrics,
}: DashboardMetricsProps) {
  return (
    <section style={gridStyle}>
      <MetricCard
        title="Check-in oggi"
        value={metrics.checkInsToday}
        subtitle="Arrivi previsti"
        tone="blue"
      />

      <MetricCard
        title="Check-out oggi"
        value={metrics.checkOutsToday}
        subtitle="Partenze previste"
        tone="violet"
      />

      <MetricCard
        title="Task aperti"
        value={metrics.openTasks}
        subtitle="Attività prioritarie caricate"
        tone="yellow"
      />

      <MetricCard
        title="Task scaduti"
        value={metrics.overdueTasks}
        subtitle="Richiedono attenzione"
        tone={metrics.overdueTasks > 0 ? "red" : "green"}
      />

      <MetricCard
        title="Eventi in attesa"
        value={metrics.pendingEvents}
        subtitle="Coda IMPERIUM"
        tone={metrics.pendingEvents > 0 ? "yellow" : "green"}
      />

      <MetricCard
        title="Eventi falliti"
        value={metrics.failedEvents}
        subtitle="Automazioni da verificare"
        tone={metrics.failedEvents > 0 ? "red" : "green"}
      />

      <MetricCard
        title="Job in coda"
        value={metrics.queuedBackgroundJobs}
        subtitle="In attesa di elaborazione"
        tone={metrics.queuedBackgroundJobs > 0 ? "yellow" : "green"}
      />

      <MetricCard
        title="Job in esecuzione"
        value={metrics.runningBackgroundJobs}
        subtitle="Elaborazioni attive"
        tone={metrics.runningBackgroundJobs > 0 ? "blue" : "green"}
      />

      <MetricCard
        title="Job completati"
        value={metrics.completedBackgroundJobs}
        subtitle="Elaborazioni concluse"
        tone="green"
      />

      <MetricCard
        title="Job falliti"
        value={metrics.failedBackgroundJobs}
        subtitle="Richiedono una verifica"
        tone={metrics.failedBackgroundJobs > 0 ? "red" : "green"}
      />
    </section>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: uiTokens.spacing.md,
  marginBottom: uiTokens.spacing.lg,
};