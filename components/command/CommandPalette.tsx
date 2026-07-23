"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
};

type SearchResult = {
  id: string;
  type:
    | "BOOKING"
    | "GUEST"
    | "PROPERTY"
    | "OWNER"
    | "DOCUMENT"
    | "TASK";
  title: string;
  subtitle?: string | null;
  href: string;
};

export function CommandPalette({
  isOpen,
  onClose,
}: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setQuery("");
    setResults([]);
    setSelectedIndex(0);

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [isOpen]);

  useEffect(() => {
    const normalizedQuery = query.trim();

    setSelectedIndex(0);

    if (!isOpen || normalizedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(normalizedQuery)}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Ricerca non disponibile.");
        }

        const data = (await response.json()) as {
          results: SearchResult[];
        };

        setResults(data.results);
        setSelectedIndex(0);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setResults([]);
        setSelectedIndex(0);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (results.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();

        setSelectedIndex((currentIndex) =>
          currentIndex >= results.length - 1
            ? 0
            : currentIndex + 1
        );

        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();

        setSelectedIndex((currentIndex) =>
          currentIndex <= 0
            ? results.length - 1
            : currentIndex - 1
        );

        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        const selectedResult = results[selectedIndex];

        if (selectedResult) {
          openResult(selectedResult);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, results, selectedIndex]);

  if (!isOpen) {
    return null;
  }

  function openResult(result: SearchResult) {
    onClose();
    router.push(result.href);
  }

  return (
    <div
      style={overlayStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Ricerca globale"
        style={dialogStyle}
      >
        <div style={searchRowStyle}>
          <span style={searchIconStyle}>⌕</span>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca ospiti, prenotazioni, immobili..."
            style={inputStyle}
          />

          <kbd style={keyStyle}>Esc</kbd>
        </div>

        <div style={contentStyle}>
          {query.trim().length < 2 ? (
            <div style={messageStyle}>
              Digita almeno due caratteri per iniziare.
            </div>
          ) : isLoading ? (
            <div style={messageStyle}>Ricerca in corso...</div>
          ) : results.length === 0 ? (
            <div style={messageStyle}>
              Nessun risultato trovato.
            </div>
          ) : (
            <div style={resultsStyle}>
              {results.map((result, index) => {
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() => openResult(result)}
                    onMouseEnter={() => {
                      setSelectedIndex(index);
                    }}
                    style={{
                      ...resultButtonStyle,
                      background: isSelected
                        ? "#eef2ff"
                        : "#ffffff",
                      boxShadow: isSelected
                        ? "inset 0 0 0 1px #c7d2fe"
                        : "none",
                    }}
                    aria-selected={isSelected}
                  >
                    <span
                      style={{
                        ...typeBadgeStyle,
                        background: isSelected
                          ? "#e0e7ff"
                          : "#eef2ff",
                      }}
                    >
                      {getResultLabel(result.type)}
                    </span>

                    <span style={resultContentStyle}>
                      <strong style={resultTitleStyle}>
                        {result.title}
                      </strong>

                      {result.subtitle ? (
                        <span style={resultSubtitleStyle}>
                          {result.subtitle}
                        </span>
                      ) : null}
                    </span>

                    <span style={arrowStyle}>
                      {isSelected ? "↵" : "→"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer style={footerStyle}>
          <span>↑ ↓ per navigare</span>
          <span>Invio per aprire · Esc per chiudere</span>
        </footer>
      </section>
    </div>
  );
}

function getResultLabel(type: SearchResult["type"]) {
  const labels: Record<SearchResult["type"], string> = {
    BOOKING: "Booking",
    GUEST: "Ospite",
    PROPERTY: "Immobile",
    OWNER: "Proprietario",
    DOCUMENT: "Documento",
    TASK: "Task",
  };

  return labels[type];
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "12vh 20px 20px",
  background: "rgba(15, 23, 42, 0.46)",
  backdropFilter: "blur(6px)",
};

const dialogStyle: CSSProperties = {
  width: "min(720px, 100%)",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  background: "#ffffff",
  boxShadow: "0 30px 80px rgba(15, 23, 42, 0.24)",
};

const searchRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px 18px",
  borderBottom: "1px solid #e2e8f0",
};

const searchIconStyle: CSSProperties = {
  fontSize: "22px",
  color: "#64748b",
};

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "16px",
  color: "#0f172a",
};

const keyStyle: CSSProperties = {
  padding: "4px 7px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#f8fafc",
  fontSize: "11px",
  color: "#64748b",
  boxShadow: "inset 0 -1px 0 #cbd5e1",
};

const contentStyle: CSSProperties = {
  maxHeight: "460px",
  overflowY: "auto",
};

const messageStyle: CSSProperties = {
  padding: "48px 20px",
  textAlign: "center",
  fontSize: "14px",
  color: "#64748b",
};

const resultsStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  padding: "8px",
};

const resultButtonStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "96px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  padding: "12px",
  border: "none",
  borderRadius: "12px",
  textAlign: "left",
  cursor: "pointer",
  transition:
    "background 120ms ease, box-shadow 120ms ease",
};

const typeBadgeStyle: CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  padding: "5px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
  color: "#4338ca",
};

const resultContentStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const resultTitleStyle: CSSProperties = {
  overflow: "hidden",
  fontSize: "14px",
  color: "#0f172a",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const resultSubtitleStyle: CSSProperties = {
  overflow: "hidden",
  fontSize: "12px",
  color: "#64748b",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const arrowStyle: CSSProperties = {
  fontSize: "16px",
  color: "#6366f1",
};

const footerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 18px",
  borderTop: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: "11px",
  color: "#64748b",
};