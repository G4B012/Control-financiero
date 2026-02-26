import React, { useEffect, useMemo, useRef, useState } from "react";
import supabase from "./lib/supabase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

// Estado base (ajústalo si tu app ya tiene uno distinto)
function defaultStateFor(email) {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return {
    user: email || "Usuario",
    currency: "RD$",
    salary: 0,
    selectedMonth: ym,
    extraIncomes: [],
    expenses: [],
    templates: { fixed: [], variable: [] },
    savings: [],
    debtPayments: [],
    goal: { name: "", target: "" },
    debt: { name: "", total: 0 },
    
  };
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [state, setState] = useState(null);
  const [loadingState, setLoadingState] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1) Inicializa sesión + listener
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) console.error(error);
        setSession(data?.session ?? null);
      } catch (e) {
        console.error(e);
        if (mounted) setErrorMsg(String(e?.message || e));
      } finally {
        if (mounted) setCheckingSession(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  // 2) Carga state del usuario desde Supabase
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setErrorMsg("");
      if (!session?.user?.id) {
        setState(null);
        return;
      }

      setLoadingState(true);
      try {
        const { data, error } = await supabase
          .from("user_state")
          .select("state")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (cancelled) return;

        if (data?.state) {
          setState(data.state);
        } else {
          // no existe todavía: crear default
          const base = defaultStateFor(session.user.email);
          const { error: insErr } = await supabase
            .from("user_state")
            .insert({ user_id: session.user.id, state: base });

          if (insErr) throw insErr;
          setState(base);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setErrorMsg(String(e?.message || e));
      } finally {
        if (!cancelled) setLoadingState(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // 3) Auto-guardar state (debounce) en Supabase cada vez que cambie
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!session?.user?.id) return;
    if (!state) return;

    // debounce 800ms
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("user_state")
          .upsert({ user_id: session.user.id, state, updated_at: new Date().toISOString() });

        if (error) throw error;
      } catch (e) {
        console.error("Save state error:", e);
        // no bloqueamos la UI por error de guardado, solo lo reportamos
      }
    }, 800);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, session?.user?.id]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setState(null);
  };

  const onResetUser = () => {
    if (!session?.user?.email) return;
    setState(defaultStateFor(session.user.email));
  };

  // UI
  if (checkingSession) return <div style={{ padding: 20 }}>Cargando sesión...</div>;
  if (!session) return <Login />;
  if (loadingState || !state) return <div style={{ padding: 20 }}>Cargando...</div>;

  return (
    <>
      {errorMsg ? (
        <div style={{ padding: 12, margin: 12, borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3" }}>
          <b>Error:</b> {errorMsg}
        </div>
      ) : null}

      <Dashboard
        state={state}
        setState={setState}
        onLogout={onLogout}
        onResetUser={onResetUser}
      />
    </>
  );
}
