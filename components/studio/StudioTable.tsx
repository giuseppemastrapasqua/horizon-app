"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

export type StudioColumn<T> = {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render: (item: T) => ReactNode;
  sortValue?: (item: T) => string | number | Date;
};

type StudioTableProps<T> = {
  data: T[];
  columns: StudioColumn<T>[];
  getRowKey: (item: T) => string;
  getRowHref?: (item: T) => string;
  onRowClick?: (item: T) => void;
  selectedRowKey?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function StudioTable<T>({
  data,
  columns,
  getRowKey,
  getRowHref,
  onRowClick,
  selectedRowKey,
  emptyTitle = "Nessun risultato",
  emptyDescription = "Non ci sono elementi da mostrare.",
}: StudioTableProps<T>) {
  const router = useRouter();

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">("asc");

  const sortedData = useMemo(() => {
    if (!sortKey) {
      return data;
    }

    const column = columns.find(
      (currentColumn) => currentColumn.key === sortKey
    );

    if (!column?.sortValue) {
      return data;
    }

    return [...data].sort((firstItem, secondItem) => {
      const firstValue = column.sortValue?.(firstItem);
      const secondValue = column.sortValue?.(secondItem);

      if (
        firstValue === undefined ||
        secondValue === undefined
      ) {
        return 0;
      }

      const normalizedFirst =
        firstValue instanceof Date
          ? firstValue.getTime()
          : firstValue;

      const normalizedSecond =
        secondValue instanceof Date
          ? secondValue.getTime()
          : secondValue;

      if (normalizedFirst < normalizedSecond) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (normalizedFirst > normalizedSecond) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });
  }, [columns, data, sortDirection, sortKey]);

  function handleSort(column: StudioColumn<T>) {
    if (!column.sortValue) {
      return;
    }

    if (sortKey === column.key) {
      setSortDirection((currentDirection) =>
        currentDirection === "asc" ? "desc" : "asc"
      );

      return;
    }

    setSortKey(column.key);
    setSortDirection("asc");
  }

  if (data.length === 0) {
    return (
      <div style={emptyStyle}>
        <strong style={emptyTitleStyle}>
          {emptyTitle}
        </strong>

        <p style={emptyDescriptionStyle}>
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={scrollStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    ...headerCellStyle,
                    width: column.width,
                    textAlign: column.align ?? "left",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column)}
                    disabled={!column.sortValue}
                    style={{
                      ...headerButtonStyle,
                      justifyContent:
                        column.align === "right"
                          ? "flex-end"
                          : column.align === "center"
                            ? "center"
                            : "flex-start",
                      cursor: column.sortValue
                        ? "pointer"
                        : "default",
                    }}
                  >
                    <span>{column.header}</span>

                    {sortKey === column.key ? (
                      <span aria-hidden="true">
                        {sortDirection === "asc"
                          ? "↑"
                          : "↓"}
                      </span>
                    ) : column.sortValue ? (
                      <span
                        style={inactiveSortStyle}
                        aria-hidden="true"
                      >
                        ↕
                      </span>
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedData.map((item, index) => {
              const rowKey = getRowKey(item);
              const href = getRowHref?.(item);
              const isSelected = selectedRowKey === rowKey;

              const defaultBackground =
                index % 2 === 0 ? "#ffffff" : "#fbfdff";

              const rowBackground = isSelected
                ? "#eef2ff"
                : defaultBackground;

              return (
                <tr
                  key={rowKey}
                  onClick={() => {
                    if (onRowClick) {
                      onRowClick(item);
                      return;
                    }

                    if (href) {
                      router.push(href);
                    }
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background =
                      isSelected ? "#e0e7ff" : "#f1f5f9";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background =
                      rowBackground;
                  }}
                  style={{
                    ...rowStyle,
                    cursor:
                      onRowClick || href
                        ? "pointer"
                        : "default",
                    background: rowBackground,
                  }}
                  aria-selected={isSelected}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{
                        ...cellStyle,
                        textAlign:
                          column.align ?? "left",
                      }}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const containerStyle: CSSProperties = {
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  background: "#ffffff",
};

const scrollStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: "980px",
  borderCollapse: "collapse",
};

const headerCellStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  padding: "14px 16px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#64748b",
  whiteSpace: "nowrap",
};

const headerButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  width: "100%",
  padding: 0,
  border: "none",
  background: "transparent",
  font: "inherit",
  color: "inherit",
  textTransform: "inherit",
  letterSpacing: "inherit",
};

const inactiveSortStyle: CSSProperties = {
  opacity: 0.35,
};

const rowStyle: CSSProperties = {
  transition: "background 150ms ease",
};

const cellStyle: CSSProperties = {
  padding: "16px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: "14px",
  color: "#0f172a",
  verticalAlign: "middle",
};

const emptyStyle: CSSProperties = {
  padding: "48px 24px",
  border: "1px dashed #cbd5e1",
  borderRadius: "18px",
  background: "#ffffff",
  textAlign: "center",
};

const emptyTitleStyle: CSSProperties = {
  display: "block",
  fontSize: "16px",
  color: "#0f172a",
};

const emptyDescriptionStyle: CSSProperties = {
  margin: "8px 0 0",
  fontSize: "14px",
  color: "#64748b",
};