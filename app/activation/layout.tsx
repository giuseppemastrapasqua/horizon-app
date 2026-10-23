import type { ReactNode } from "react";
import "./activation.css";
export default function ActivationLayout({ children }: { children: ReactNode }) {
  return <div className="activation-theme">{children}</div>;
}
