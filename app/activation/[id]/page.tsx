import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { addMonths, dayRange, romeToday } from "@/lib/activation/dates";
import { loadActivationWorkspace } from "@/lib/activation/load-workspace";
import { ActivationWorkspace } from "../components/ActivationWorkspace";

export default async function ActivationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const today = romeToday();
  const from = typeof query.from === "string" ? query.from : today;
  const to = typeof query.to === "string" ? query.to : addMonths(today, 2);
  let valid = true;
  try { dayRange(from, to); } catch { valid = false; }
  const data = await loadActivationWorkspace(id, valid ? from : today, valid ? to : addMonths(today, 2));
  return <><Navigation /><AppShell title=""><ActivationWorkspace key={`${id}-${from}-${to}`} data={data} from={valid ? from : today} to={valid ? to : addMonths(today, 2)} rangeError={!valid} /></AppShell></>;
}
