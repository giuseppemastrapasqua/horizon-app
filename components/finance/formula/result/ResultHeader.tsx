import { Calculator } from "lucide-react";

import { HorizonIcon } from "@/components/ui/HorizonIcon";

export function ResultHeader() {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <HorizonIcon
          icon={Calculator}
          size={15}
          tone="primary"
        />

        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#64748b",
          }}
        >
          Anteprima live
        </p>
      </div>

      <h2
        style={{
          margin: "8px 0 0",
          fontSize: 22,
          color: "#0f172a",
        }}
      >
        Ricavo proprietario
      </h2>
    </>
  );
}