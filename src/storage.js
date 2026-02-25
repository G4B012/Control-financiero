import { v4 as uuidv4 } from "uuid";

const ns = (user) => `cfp:${user}`;

export function loadState(user){
  const raw = localStorage.getItem(ns(user));
  if (!raw) return freshState(user);
  try { 
    const s = JSON.parse(raw);
    return { ...freshState(user), ...s };
  } catch {
    return freshState(user);
  }
}

export function saveState(user, state){
  localStorage.setItem(ns(user), JSON.stringify(state));
}

export function freshState(user){
  return {
    user,
    currency: "RD$",
    salary: 0,
    selectedMonth: defaultMonth(),
    expenses: [], // {id, month, type, category, budget, amount, note}
    templates: { fixed: [], variable: [] }, // persist budgets forward
    goal: { name: "Meta de ahorro", target: 550000 },
    savings: [], // {id, month, date, amount, note}
    debt: { name: "Deuda", total: 0 },
    debtPayments: [], // {id, month, date, amount, note}
  }
}

export function defaultMonth(d = new Date()){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  return `${y}-${m}`;
}

export function monthsWindow(years=6){
  const out = [];
  const d = new Date();
  d.setDate(1);
  const start = new Date(d);
  start.setMonth(start.getMonth() - 24);
  const total = years*12 + 24;
  for (let i=0;i<=total;i++){
    const y = start.getFullYear();
    const m = String(start.getMonth()+1).padStart(2,'0');
    out.push(`${y}-${m}`);
    start.setMonth(start.getMonth()+1);
  }
  return out;
}

export function newId(){ return uuidv4(); }

export function isActiveTemplate(t, month){
  if (t.startMonth && month < t.startMonth) return false;
  if (t.endMonth && month >= t.endMonth) return false; // exclusive
  return true;
}
