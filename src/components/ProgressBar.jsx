import React from "react";
import { clamp } from "../utils";

export default function ProgressBar({ value, colorClass="bg-coral" }){
  const pct = clamp(value, 0, 1) * 100;
  return (
    <div className="w-full bg-[#fff0f0] rounded-full border border-rose overflow-hidden h-4">
      <div className={"h-full progressFill " + colorClass} style={{ width: pct + "%" }} />
    </div>
  );
}
