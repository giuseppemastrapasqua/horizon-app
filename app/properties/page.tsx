import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
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
  }>;
};

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const {
    search = "",
    sort = "newest",
  } = await searchParams;

  const properties = await getPropertiesPageData({
    search,
    sort,
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
          </form>

          <Link href="/properties/new" style={primaryButtonStyle}>
            + Nuovo immobile
          </Link>
        </div>

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
  background: "#0f172a",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
};