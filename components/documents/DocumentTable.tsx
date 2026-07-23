type Column = {
  key: string;
  title: string;
  width?: string;
};

type DocumentTableProps = {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
};

export function DocumentTable({
  columns,
  rows,
}: DocumentTableProps) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "14px",
      }}
    >
      <thead>
        <tr
          style={{
            background: "#f8fafc",
          }}
        >
          {columns.map((column) => (
            <th
              key={column.key}
              style={{
                textAlign: "left",
                padding: "12px",
                borderBottom: "2px solid #e2e8f0",
                color: "#475569",
                fontWeight: 800,
                width: column.width,
              }}
            >
              {column.title}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, index) => (
          <tr
            key={index}
            style={{
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            {columns.map((column) => (
              <td
                key={column.key}
                style={{
                  padding: "12px",
                  color: "#0f172a",
                  verticalAlign: "top",
                }}
              >
                {row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}