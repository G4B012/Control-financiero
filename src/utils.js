export const money = (v, currency="RD$") => {
  if (v === "" || v == null || Number.isNaN(Number(v))) return `${currency} 0`;
  const n = Number(v);
  return `${currency} ` + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

export function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

export function prevMonth(month){
  const [y,m] = month.split("-").map(Number);
  const d = new Date(y, m-1, 1);
  d.setMonth(d.getMonth()-1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  return `${yy}-${mm}`;
}

export function sum(arr, fn){
  return arr.reduce((acc, x) => acc + (fn ? fn(x) : x), 0);
}

export function monthLabelES(month){ // "Enero 2026"
  const [y,m] = month.split("-").map(Number);
  const d = new Date(y, m-1, 1);
  const fmt = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
  const s = fmt.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function monthEnabled(month, now = new Date()){
  const [y,m] = month.split("-").map(Number);
  const first = new Date(y, m-1, 1);
  const enableAt = new Date(first);
  enableAt.setDate(enableAt.getDate() - 15);
  return now >= enableAt;
}

export function ymCompare(a,b){ return a.localeCompare(b); }
