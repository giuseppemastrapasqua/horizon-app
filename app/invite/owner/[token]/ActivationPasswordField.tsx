"use client";

import { useState } from "react";

export function ActivationPasswordField({
  name,
  label,
}: {
  name: "password" | "confirmPassword";
  label: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-[#FFF8EA]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={visible ? "text" : "password"}
        minLength={10}
        maxLength={128}
        required
        autoComplete="new-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-describedby={name === "password" ? "password-help" : undefined}
        className="mt-2 w-full rounded-xl border border-white/15 bg-[#0D1923] px-4 py-3 text-[#FFF8EA] outline-none focus:border-[#D8B367] focus:ring-2 focus:ring-[#D8B367]/15"
      />
      <button
        type="button"
        aria-controls={name}
        aria-pressed={visible}
        aria-label={`${visible ? "Nascondi" : "Mostra"} ${label.toLowerCase()}`}
        onClick={() => setVisible((previous) => !previous)}
        className="mt-1 min-h-11 rounded-lg px-2 text-sm font-medium text-[#D8B367] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8B367]"
      >
        {visible ? "Nascondi password" : "Mostra password"}
      </button>
      {name === "password" && (
        <p id="password-help" className="mt-1 text-xs text-[#8EA0AE]">
          Almeno 10 caratteri.
        </p>
      )}
    </div>
  );
}
