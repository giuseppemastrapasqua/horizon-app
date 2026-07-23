import type { CSSProperties, ReactNode } from "react";

type StudioLayoutProps = {
  main: ReactNode;
  preview?: ReactNode;
  footer?: ReactNode;
  previewWidth?: string;
};

export function StudioLayout({
  main,
  preview,
  footer,
  previewWidth = "360px",
}: StudioLayoutProps) {
  return (
    <div style={layoutStyle}>
      <div
        style={{
          ...contentStyle,
          gridTemplateColumns: preview
            ? `minmax(0, 1fr) ${previewWidth}`
            : "minmax(0, 1fr)",
        }}
      >
        <section style={mainStyle}>{main}</section>

        {preview ? (
          <aside style={previewStyle}>{preview}</aside>
        ) : null}
      </div>

      {footer ? <div style={footerStyle}>{footer}</div> : null}
    </div>
  );
}

const layoutStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const contentStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
  alignItems: "start",
};

const mainStyle: CSSProperties = {
  minWidth: 0,
};

const previewStyle: CSSProperties = {
  position: "sticky",
  top: "24px",
  minWidth: 0,
};

const footerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
};