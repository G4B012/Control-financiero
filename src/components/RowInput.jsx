import React from "react";

export default function RowInput({ value, onChange, placeholder, type="text", right=false, small=false }){

  const format = (val) => {
    if (type !== "number") return val;
    if (!val) return "";
    return Number(val).toLocaleString("en-US");
  };

  const parse = (val) => {
    if (type !== "number") return val;
    return val.replace(/,/g, "");
  };

  return (
    <input
      className={(small ? "inputSm" : "input") + (right ? " text-right font-semibold tracking-wide pr-2" : "")}
      value={format(value)}
      type="text"
      placeholder={placeholder}
      onChange={(e)=>onChange(parse(e.target.value))}
    />
  );
}
