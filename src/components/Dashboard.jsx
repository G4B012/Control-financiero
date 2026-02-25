import React, { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { CATEGORIES } from "../categories";
import { monthsWindow, newId, isActiveTemplate } from "../storage";
import { money, prevMonth, sum, monthLabelES, monthEnabled, ymCompare } from "../utils";
import Donut from "./Donut";
import ProgressBar from "./ProgressBar";
import RowInput from "./RowInput";

function semaforo(budget, actual){
  if (!budget || budget <= 0 || actual == null) return "";
  return actual <= budget ? "🟢" : "🔴";
}

function sortByDateAsc(a,b){ return (a.date||"").localeCompare(b.date||""); }

export default function Dashboard({ state, setState, onLogout, onResetUser }){
  const currency = state.currency || "RD$";
  const months = useMemo(()=> monthsWindow(6).sort(ymCompare), []);
  const month = state.selectedMonth;
  const now = new Date();

  // Seed budgets into a new month automatically (templates) if month has no expenses yet
  const seededRef = useRef(new Set());
  useEffect(() => {
    const key = `${state.user}:${month}`;
    if (seededRef.current.has(key)) return;

    setState(s => {
      const hasAny = s.expenses.some(e => e.month === month);
      if (hasAny) { seededRef.current.add(key); return s; }

      const templFixed = (s.templates?.fixed || []).filter(t => isActiveTemplate(t, month));
      const templVar   = (s.templates?.variable || []).filter(t => isActiveTemplate(t, month));

      const seeded = [
        ...templFixed.map(t => ({ id: newId(), month, type:"fixed", category: t.category, budget: t.budget, amount:"", note:"" })),
        ...templVar.map(t => ({ id: newId(), month, type:"variable", category: t.category, budget: t.budget, amount:"", note:"" })),
      ];

      seededRef.current.add(key);
      return { ...s, expenses: [...s.expenses, ...seeded] };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const fixedRows = state.expenses.filter(e => e.month === month && e.type === "fixed");
  const varRows   = state.expenses.filter(e => e.month === month && e.type === "variable");

  const fixedTotalBudget = sum(fixedRows, r => Number(r.budget||0));
  const fixedTotalActual = sum(fixedRows, r => Number(r.amount||0));
  const varTotalBudget   = sum(varRows, r => Number(r.budget||0));
  const varTotalActual   = sum(varRows, r => Number(r.amount||0));
  const expenseTotal = fixedTotalActual + varTotalActual;

  const savingsMonth = state.savings.filter(s => s.month === month).slice().sort(sortByDateAsc);
  const savingsMonthTotal = sum(savingsMonth, s => Number(s.amount||0));
  const savingsTotal = sum(state.savings, s => Number(s.amount||0));

  const debtMonth = state.debtPayments.filter(p => p.month === month).slice().sort(sortByDateAsc);
  const debtMonthTotal = sum(debtMonth, p => Number(p.amount||0));
  const debtPaidTotal  = sum(state.debtPayments, p => Number(p.amount||0));

  const balance = Number(state.salary||0) - expenseTotal - savingsMonthTotal - debtMonthTotal;

  const prev = prevMonth(month);
  const prevExp = sum(state.expenses.filter(e => e.month === prev), e => Number(e.amount||0));
  const change = prevExp > 0 ? (expenseTotal - prevExp) / prevExp : null;
  const changeOk = change == null ? null : change <= 0;

  const donutData = [
    { name: "Fijos", value: state.salary ? (fixedTotalActual / state.salary) : 0 },
    { name: "Variables", value: state.salary ? (varTotalActual / state.salary) : 0 },
    { name: "Ahorro", value: state.salary ? (savingsMonthTotal / state.salary) : 0 },
    { name: "Deuda", value: state.salary ? (debtMonthTotal / state.salary) : 0 },
  ].map(x => ({...x, value: Math.max(0, Math.min(1, x.value))}));

  const budgetTotal = fixedTotalBudget + varTotalBudget;
  const budgetOk = budgetTotal > 0 ? (expenseTotal <= budgetTotal) : null;

  const goalName = state.goal?.name || "Meta de ahorro";
  const goalTarget = Number(state.goal?.target || 550000);
  const goalPct = goalTarget ? (savingsTotal / goalTarget) : 0;

  const debtTotal = Number(state.debt?.total||0);
  const debtPct = debtTotal ? (debtPaidTotal / debtTotal) : 0;

  // show existing rows + 1 empty row (not long)
  const rowsFor = (type) => {
    const list = state.expenses.filter(r => r.month === month && r.type === type);
    return [...list, { id: null, month, type, category:"", budget:"", amount:"", note:"" }];
  };

  const upsertExpense = (type, idx, patch) => {
    setState(s => {
      const rows = s.expenses.slice();
      const list = rows.filter(r => r.month === month && r.type === type);
      const row = list[idx] || { id: newId(), month, type, category: "", budget: "", amount: "", note: "" };
      const updated = { ...row, ...patch };

      const masterIdx = rows.findIndex(r => r.id === updated.id);
      if (masterIdx >= 0) rows[masterIdx] = updated; else rows.push(updated);

      // persist budgets as templates (if category set and budget > 0)
      const cat = (updated.category || "").trim();
      const bud = Number(updated.budget || 0);
      if (cat) {
        const tplKey = type === "fixed" ? "fixed" : "variable";
        const tpls = (s.templates?.[tplKey] || []).slice();
        const existing = tpls.find(t => t.category === cat && (t.endMonth == null || month < t.endMonth));
        if (bud > 0) {
          if (existing) { existing.budget = bud; if (existing.startMonth && month < existing.startMonth) existing.startMonth = month; }
          else tpls.push({ id: newId(), category: cat, budget: bud, startMonth: month, endMonth: null });
          return { ...s, expenses: rows, templates: { ...s.templates, [tplKey]: tpls } };
        }
      }
      return { ...s, expenses: rows };
    });
  };

  const removeExpense = (id) => {
    setState(s => {
      const target = s.expenses.find(r => r.id === id);
      const nextExpenses = s.expenses.filter(r => r.id !== id);

      // if it had a budget, cut template from this month forward
      if (target?.category && Number(target?.budget||0) > 0) {
        const tplKey = target.type === "fixed" ? "fixed" : "variable";
        const tpls = (s.templates?.[tplKey] || []).map(t => {
          if (t.category === target.category && isActiveTemplate(t, month)) return { ...t, endMonth: month };
          return t;
        });
        return { ...s, expenses: nextExpenses, templates: { ...s.templates, [tplKey]: tpls } };
      }
      return { ...s, expenses: nextExpenses };
    });
  };

  const addExpenseRow = (type) => {
    setState(s => ({ ...s, expenses: [...s.expenses, { id: newId(), month, type, category:"", budget:"", amount:"", note:"" }] }));
  };

  const upsertSavings = (idx, patch) => {
    setState(s => {
      const rows = s.savings.slice();
      const list = rows.filter(r => r.month === month);
      const row = list[idx] || { id: newId(), month, date: "", amount: "", note: "" };
      const updated = { ...row, ...patch };
      const masterIdx = rows.findIndex(r => r.id === updated.id);
      if (masterIdx >= 0) rows[masterIdx] = updated; else rows.push(updated);
      return { ...s, savings: rows };
    });
  };
  const removeSavings = (id) => setState(s => ({ ...s, savings: s.savings.filter(r => r.id !== id) }));

  const upsertDebtPay = (idx, patch) => {
    setState(s => {
      const rows = s.debtPayments.slice();
      const list = rows.filter(r => r.month === month);
      const row = list[idx] || { id: newId(), month, date: "", amount: "", note: "" };
      const updated = { ...row, ...patch };
      const masterIdx = rows.findIndex(r => r.id === updated.id);
      if (masterIdx >= 0) rows[masterIdx] = updated; else rows.push(updated);
      return { ...s, debtPayments: rows };
    });
  };
  const removeDebtPay = (id) => setState(s => ({ ...s, debtPayments: s.debtPayments.filter(r => r.id !== id) }));

  const historySavings = state.savings
    .slice()
    .sort((a,b)=> (b.month+(b.date||"")).localeCompare(a.month+(a.date||"")))
    .slice(0, 8);

  const historyDebt = state.debtPayments
    .slice()
    .sort((a,b)=> (b.month+(b.date||"")).localeCompare(a.month+(a.date||"")))
    .slice(0, 8);

  return (
    <div className="min-h-screen p-5 md:p-8 bg-gradient-to-br from-[#fff4f4] via-white to-[#fff0ef]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-wine text-3xl font-extrabold tracking-tight">Control Financiero</div>
          <div className="text-wine2 mt-1 text-sm">{state.user}</div>
        </div>
        <div className="flex gap-2">
          <button className="btnGhost" onClick={onResetUser}>Reset</button>
          <button className="btn" onClick={onLogout}>Salir</button>
        </div>
      </div>

      {/* Top grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-5">
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.25}} className="card lg:col-span-3">
          <div className="cardHeader flex items-center justify-between">
            <div>
              <div className="label">Salario mensual</div>
              <div className="text-wine text-2xl font-extrabold mt-1">{money(state.salary, currency)}</div>
            </div>
            <span className="pillFixed">🎯</span>
          </div>
          <div className="cardBody">
            <RowInput right value={state.salary} onChange={(v)=>setState(s=>({...s, salary: Number(v||0)}))} placeholder="Ej: 200000" type="number" />
          </div>
        </motion.div>

        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.25,delay:.05}} className="card lg:col-span-3">
          <div className="cardHeader flex items-center justify-between">
            <div>
              <div className="label text-center">Mes</div>
              <div className="text-center text-wine text-xl font-extrabold mt-1">{monthLabelES(month)}</div>
            </div>
            <span className="pillVar">🗓️</span>
          </div>
          <div className="cardBody">
            <select className="input" value={month} onChange={(e)=>setState(s=>({...s, selectedMonth: e.target.value}))}>
              {months.map(m => (
                <option key={m} value={m} disabled={!monthEnabled(m, now)}>
                  {monthLabelES(m)}{monthEnabled(m, now) ? "" : " 🔒"}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.25,delay:.10}} className="card lg:col-span-3">
          <div className="cardHeader flex items-center justify-between">
            <div className="label">Distribución (% salario)</div>
            <span className="pillDebt">🍩</span>
          </div>
          <div className="cardBody">
            <Donut data={donutData} />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {donutData.map(d=>(
                <div key={d.name} className="badge justify-between">
                  <span>{d.name}</span><span>{(d.value*100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.25,delay:.15}} className="card lg:col-span-3">
          <div className="cardHeader flex items-center justify-between">
            <div className="label">KPIs del mes</div>
            <span className="pillSave">📌</span>
          </div>
          <div className="cardBody space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-wine2 font-semibold">Gastos</span>
              <span className="text-wine font-extrabold">{money(expenseTotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-wine2 font-semibold">Ahorro</span>
              <span className="text-wine font-extrabold">{money(savingsMonthTotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-wine2 font-semibold">Deuda</span>
              <span className="text-wine font-extrabold">{money(debtMonthTotal, currency)}</span>
            </div>
            <div className="h-px bg-rose my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-wine2 font-semibold">Balance</span>
              <span className={"font-extrabold " + (balance<0 ? "text-red-700" : "text-wine")}>{money(balance, currency)}</span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-wine2 font-semibold">Vs mes anterior</span>
                <span className="font-extrabold text-wine">{change == null ? "—" : `${(change*100).toFixed(0)}%`} {changeOk==null ? "" : (changeOk ? "🟢" : "🔴")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-wine2 font-semibold">Semáforo presupuesto</span>
                <span className="font-extrabold text-wine">{budgetOk==null ? "—" : (budgetOk ? "🟢" : "🔴")}</span>
              </div>
              <div className="text-xs text-wine2/60">Presupuesto = suma de “Presup.” en Fijos + Variables.</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        {/* Ahorro left */}
        <div className="card lg:col-span-4">
          <div className="cardHeader flex items-start justify-between">
            <div>
              <div className="text-wine2 font-extrabold text-lg">💰 Ahorro</div>
              <div className="text-xs text-wine2/70">Meta editable + historial visible</div>
            </div>
            <span className="pillSave">AHORRO</span>
          </div>
          <div className="cardBody space-y-3">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7">
                <div className="label">Nombre de la meta</div>
                <RowInput value={goalName} onChange={(v)=>setState(s=>({...s, goal: { ...s.goal, name: v }}))} placeholder="Ej: Viaje, Fondo, Carro..." />
              </div>
              <div className="col-span-5">
                <div className="label">Meta</div>
                <RowInput right type="number" value={goalTarget} onChange={(v)=>setState(s=>({...s, goal: { ...s.goal, target: Number(v||0) }}))} placeholder="550000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rowCard pop-in">
                <div className="label">Ahorrado (total)</div>
                <div className="text-wine text-xl font-extrabold mt-1">{money(savingsTotal, currency)}</div>
              </div>
              <div className="rowCard pop-in">
                <div className="label">Ahorro del mes</div>
                <div className="text-wine text-xl font-extrabold mt-1">{money(savingsMonthTotal, currency)}</div>
              </div>
            </div>

            <div className="rowCard space-y-2">
              <div className="flex justify-between text-sm font-semibold text-wine2">
                <span>Progreso</span><span>{(goalPct*100).toFixed(1)}%</span>
              </div>
              <ProgressBar value={goalPct} colorClass="bg-mint" />
              <div className="text-xs text-wine2/70">Restante: {money(Math.max(0, goalTarget - savingsTotal), currency)}</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-wine2 font-extrabold">Registros (este mes)</div>
              <button className="btnGhost" onClick={()=>upsertSavings(savingsMonth.length, { id: newId(), month, date: "", amount: "", note: "" })}>+ agregar</button>
            </div>

            <div className="space-y-2">
              {[...savingsMonth, { id:null, month, date:"", amount:"", note:"" }].map((r, idx)=>(
                <div key={r.id || idx} className={"rowCard " + (r.id ? "pop-in" : "")}>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <input className="input" type="date" value={r.date} onChange={(e)=>upsertSavings(idx,{ id: r.id || newId(), date: e.target.value })} />
                    </div>
                    <div className="col-span-4">
                      <RowInput right type="number" value={r.amount} onChange={(v)=>upsertSavings(idx,{ id: r.id || newId(), amount: v })} placeholder="Monto" />
                    </div>
                    <div className="col-span-3">
                      <RowInput small value={r.note} onChange={(v)=>upsertSavings(idx,{ id: r.id || newId(), note: v })} placeholder="Nota" />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {r.id ? <button className="btnGhost px-2" onClick={()=>removeSavings(r.id)}>✕</button> : <span className="text-wine2/30">—</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px bg-rose" />
            <div className="text-wine2 font-extrabold">Últimos movimientos</div>
            <div className="space-y-2">
              {historySavings.length === 0 ? (
                <div className="text-sm text-wine2/60">Sin movimientos todavía.</div>
              ) : historySavings.map((r)=>(
                <div key={r.id} className="rowCard flex items-center justify-between pop-in">
                  <div>
                    <div className="text-sm font-extrabold text-wine">{money(r.amount, currency)}</div>
                    <div className="text-xs text-wine2/70">{monthLabelES(r.month)} • {r.date || "—"} {r.note ? `• ${r.note}` : ""}</div>
                  </div>
                  <span className="pillSave">+</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed center */}
        <div className="card lg:col-span-4">
          <div className="cardHeader flex items-start justify-between">
            <div>
              <div className="text-wine2 font-extrabold text-lg">❤️ Gastos fijos</div>
              <div className="text-xs text-wine2/70">Presupuesto se guarda mes a mes (solo registras “Monto”)</div>
            </div>
            <span className="pillFixed">FIJOS</span>
          </div>
          <div className="cardBody space-y-3">
            <div className="flex items-center justify-between">
              <div className="badge">Presupuesto: {money(fixedTotalBudget, currency)}</div>
              <div className="badge">Real: {money(fixedTotalActual, currency)} {semaforo(fixedTotalBudget, fixedTotalActual)}</div>
            </div>

            <div className="grid grid-cols-12 gap-2 text-[11px] font-extrabold text-wine2">
              <div className="col-span-4">Categoría</div>
              <div className="col-span-2 text-right">Presup.</div>
              <div className="col-span-2 text-right">Monto</div>
              <div className="col-span-2">Nota</div>
              <div className="col-span-1 text-center">🚦</div>
              <div className="col-span-1 text-center">✕</div>
            </div>

            <div className="space-y-2">
              {rowsFor("fixed").map((r, idx)=>(
                <div key={r.id || idx} className={"rowCard " + (r.id ? "pop-in" : "")}>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <select className="input" value={r.category} onChange={(e)=>upsertExpense("fixed", idx, { id: r.id || newId(), category: e.target.value })}>
                        <option value="">Elige…</option>
                        {CATEGORIES.fixed.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <RowInput right type="number" value={r.budget} onChange={(v)=>upsertExpense("fixed", idx, { id: r.id || newId(), budget: v })} placeholder="0" />
                    </div>
                    <div className="col-span-2">
                      <RowInput right type="number" value={r.amount} onChange={(v)=>upsertExpense("fixed", idx, { id: r.id || newId(), amount: v })} placeholder="0" />
                    </div>
                    <div className="col-span-2">
                      <RowInput small value={r.note} onChange={(v)=>upsertExpense("fixed", idx, { id: r.id || newId(), note: v })} placeholder="(opc.)" />
                    </div>
                    <div className="col-span-1 text-center text-lg">
                      {semaforo(Number(r.budget||0), Number(r.amount||0))}
                    </div>
                    <div className="col-span-1 text-center">
                      {r.id ? <button className="btnGhost px-2" onClick={()=>removeExpense(r.id)}>✕</button> : <span className="text-wine2/30">—</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btnGhost w-full" onClick={()=>addExpenseRow("fixed")}>+ agregar fila</button>
          </div>
        </div>

        {/* Variable right */}
        <div className="card lg:col-span-4">
          <div className="cardHeader flex items-start justify-between">
            <div>
              <div className="text-wine2 font-extrabold text-lg">🧡 Gastos variables</div>
              <div className="text-xs text-wine2/70">Presupuesto se guarda (si lo defines)</div>
            </div>
            <span className="pillVar">VAR</span>
          </div>
          <div className="cardBody space-y-3">
            <div className="flex items-center justify-between">
              <div className="badge">Presupuesto: {money(varTotalBudget, currency)}</div>
              <div className="badge">Real: {money(varTotalActual, currency)} {semaforo(varTotalBudget, varTotalActual)}</div>
            </div>

            <div className="grid grid-cols-12 gap-2 text-[11px] font-extrabold text-wine2">
              <div className="col-span-4">Categoría</div>
              <div className="col-span-2 text-right">Presup.</div>
              <div className="col-span-2 text-right">Monto</div>
              <div className="col-span-2">Nota</div>
              <div className="col-span-1 text-center">🚦</div>
              <div className="col-span-1 text-center">✕</div>
            </div>

            <div className="space-y-2">
              {rowsFor("variable").map((r, idx)=>(
                <div key={r.id || idx} className={"rowCard " + (r.id ? "pop-in" : "")}>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <select className="input" value={r.category} onChange={(e)=>upsertExpense("variable", idx, { id: r.id || newId(), category: e.target.value })}>
                        <option value="">Elige…</option>
                        {CATEGORIES.variable.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <RowInput right type="number" value={r.budget} onChange={(v)=>upsertExpense("variable", idx, { id: r.id || newId(), budget: v })} placeholder="0" />
                    </div>
                    <div className="col-span-2">
                      <RowInput right type="number" value={r.amount} onChange={(v)=>upsertExpense("variable", idx, { id: r.id || newId(), amount: v })} placeholder="0" />
                    </div>
                    <div className="col-span-2">
                      <RowInput small value={r.note} onChange={(v)=>upsertExpense("variable", idx, { id: r.id || newId(), note: v })} placeholder="(opc.)" />
                    </div>
                    <div className="col-span-1 text-center text-lg">
                      {semaforo(Number(r.budget||0), Number(r.amount||0))}
                    </div>
                    <div className="col-span-1 text-center">
                      {r.id ? <button className="btnGhost px-2" onClick={()=>removeExpense(r.id)}>✕</button> : <span className="text-wine2/30">—</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btnGhost w-full" onClick={()=>addExpenseRow("variable")}>+ agregar fila</button>
          </div>
        </div>
      </div>

      {/* Bottom: debt right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        <div className="lg:col-span-8"></div>
        <div className="card lg:col-span-4">
          <div className="cardHeader flex items-start justify-between">
            <div>
              <div className="text-wine2 font-extrabold text-lg">💳 Deuda</div>
              <div className="text-xs text-wine2/70">Una sola deuda activa + historial visible</div>
            </div>
            <span className="pillDebt">DEUDA</span>
          </div>
          <div className="cardBody space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="label">Nombre</div>
                <RowInput value={state.debt?.name || ""} onChange={(v)=>setState(s=>({...s, debt: { ...s.debt, name: v }}))} placeholder="Ej: Préstamo" />
              </div>
              <div>
                <div className="label">Total</div>
                <RowInput right type="number" value={state.debt?.total || 0} onChange={(v)=>setState(s=>({...s, debt: { ...s.debt, total: Number(v||0) }}))} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rowCard pop-in">
                <div className="label">Pagado (total)</div>
                <div className="text-wine text-xl font-extrabold mt-1">{money(debtPaidTotal, currency)}</div>
              </div>
              <div className="rowCard pop-in">
                <div className="label">Restante</div>
                <div className="text-wine text-xl font-extrabold mt-1">{money(Math.max(0, debtTotal - debtPaidTotal), currency)}</div>
              </div>
            </div>

            <div className="rowCard space-y-2">
              <div className="flex justify-between text-sm font-semibold text-wine2">
                <span>Progreso</span><span>{(debtPct*100).toFixed(1)}%</span>
              </div>
              <ProgressBar value={debtPct} colorClass="bg-coral" />
              <div className="text-xs text-wine2/70">Pago del mes: {money(debtMonthTotal, currency)}</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-wine2 font-extrabold">Pagos (este mes)</div>
              <button className="btnGhost" onClick={()=>upsertDebtPay(debtMonth.length, { id: newId(), month, date: "", amount: "", note: "" })}>+ agregar</button>
            </div>

            <div className="space-y-2">
              {[...debtMonth, { id:null, month, date:"", amount:"", note:"" }].map((r, idx)=>(
                <div key={r.id || idx} className={"rowCard " + (r.id ? "pop-in" : "")}>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <input className="input" type="date" value={r.date} onChange={(e)=>upsertDebtPay(idx,{ id: r.id || newId(), date: e.target.value })} />
                    </div>
                    <div className="col-span-4">
                      <RowInput right type="number" value={r.amount} onChange={(v)=>upsertDebtPay(idx,{ id: r.id || newId(), amount: v })} placeholder="Monto" />
                    </div>
                    <div className="col-span-3">
                      <RowInput small value={r.note} onChange={(v)=>upsertDebtPay(idx,{ id: r.id || newId(), note: v })} placeholder="Nota" />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {r.id ? <button className="btnGhost px-2" onClick={()=>removeDebtPay(r.id)}>✕</button> : <span className="text-wine2/30">—</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px bg-rose" />
            <div className="text-wine2 font-extrabold">Últimos pagos</div>
            <div className="space-y-2">
              {historyDebt.length === 0 ? (
                <div className="text-sm text-wine2/60">Sin pagos todavía.</div>
              ) : historyDebt.map((r)=>(
                <div key={r.id} className="rowCard flex items-center justify-between pop-in">
                  <div>
                    <div className="text-sm font-extrabold text-wine">{money(r.amount, currency)}</div>
                    <div className="text-xs text-wine2/70">{monthLabelES(r.month)} • {r.date || "—"} {r.note ? `• ${r.note}` : ""}</div>
                  </div>
                  <span className="pillDebt">−</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-wine2/60">Datos guardados localmente en este navegador por usuario.</div>
    </div>
  );
}
