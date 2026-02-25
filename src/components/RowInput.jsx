import React from "react";

export default function RowInput({
  value,
  onChange,
  placeholder,
  type = "text",
  right = false,
  small = false
}) {
  const format = (val) => {
    if (type !== "number") return val ?? "";
    if (val === null || val === undefined || val === "") return "";
    const n = Number(String(val).replace(/,/g, ""));
    if (Number.isNaN(n)) return String(val);
    return n.toLocaleString("en-US");
  };

  const parse = (val) => {
    if (type !== "number") return val;
    // deja solo números (y punto) + quita comas
    return String(val).replace(/,/g, "").replace(/[^\d.]/g, "");
  };

  return (
    <input
      className={[
        small ? "inputSm" : "input",
        right ? " text-right font-semibold tabular-nums pr-3" : " tabular-nums",
        // IMPORTANT: evita que el texto se vea cortado feo
        " overflow-hidden text-ellipsis",
      ].join("")}
      value={format(value)}
      type="text"
      inputMode={type === "number" ? "decimal" : undefined}
      placeholder={placeholder}
      onChange={(e) => onChange(parse(e.target.value))}
    />
  );
}
