import React from "react";

export default function RowInput({ value, onChange, placeholder, type="text", right=false, small=false }){
  return (
    <input
     className={
        (small ? "inputSm" : "input") +
        (right ? " text-right font-semibold tracking-wide" : "")
      }
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={(e)=>onChange(e.target.value)}
    />
  );
}
