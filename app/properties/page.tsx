import { OwnerDashboard } from "@/components/owner/OwnerPortal";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { requireUser } from "@/lib/auth/guards";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PropertySearchForm } from "@/components/properties/PropertySearchForm";
import { PropertySortSelect } from "@/components/properties/PropertySortSelect";
import {
  getPropertiesPageData,
  type PropertySortOption,
} from "@/lib/properties/get-properties-page-data";

type PropertiesPageProps = {
  searchParams: Promise<{
    search?: string;
    sort?: PropertySortOption;
    view?: "current" | "archived" | "all";
  }>;
};

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const user = await requireUser();
  if (user.role === "OWNER") return <OwnerDashboard />;

  if (user.role === "OPERATOR") {
    throw new Error("Accesso non autorizzato.");
  }
  const {
    search = "",
    sort = "newest",
    view = "current",
  } = await searchParams;

  const properties = await getPropertiesPageData({
    search,
    sort,
    view,
  });

  return (
    <>
      <Navigation />

      <AppShell
        title="Immobili Horizon"
        subtitle="Portafoglio appartamenti, score e performance iniziale."
      >
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <form
            action="/properties"
            method="get"
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flex: 1,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "320px" }}>
              <PropertySearchForm defaultValue={search} />
            </div>

            <PropertySortSelect defaultValue={sort} />
            <label className="text-sm text-[#82909C]">
              <span className="sr-only">Mostra alloggi</span>
              <select name="view" defaultValue={["current", "archived", "all"].includes(view) ? view : "current"} className="h-11 rounded-xl border border-white/10 bg-[#09131C] px-4 text-sm text-[#E8E1D5] [color-scheme:dark]">
                <option value="current">In gestione</option>
                <option value="archived">Archiviati</option>
                <option value="all">Tutti gli alloggi</option>
              </select>
            </label>
          </form>

          <Link href="/properties/new" style={primaryButtonStyle}>
            + Nuovo immobile
          </Link>
        </div>

        <p className="mb-5 text-sm text-[#82909C]">Gli alloggi archiviati sono conservati nello storico. Per consultarli, seleziona “Archiviati” e premi Cerca.</p>

        {properties.length === 0 ? (
          <div
            style={{
              padding: "56px 32px",
              border: "1px solid #e2e8f0",
              borderRadius: "24px",
              background: "#ffffff",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Nessun immobile trovato
            </h2>

            <p
              style={{
                margin: "12px 0 0",
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              Nessun immobile corrisponde alla ricerca
              {search ? ` "${search}"` : "."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
              />
            ))}
          </div>
        )}
      </AppShell>
    </>
  );
}

const primaryButtonStyle = {
  display: "inline-block",
  padding: "11px 16px",
  borderRadius: "12px",
  background: "#D8B367",
  color: "#07111A",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid #D8B367",
};
