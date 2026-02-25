import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function Donut({ data }){
  const COLORS = ["#FF6B6B", "#5DADE2", "#2ECC71", "#9B59B6"];
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={86} paddingAngle={3}>
            {data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v)=> `${(v*100).toFixed(1)}%`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
