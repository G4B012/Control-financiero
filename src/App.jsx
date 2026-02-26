import React, { useEffect, useState } from "react";
import supabase from "./lib/supabase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [fatal, setFatal] = useState("");

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        // Anti-bug: si Supabase se queda colgado por X razón, no te deja infinito
        const timeout = new Promise((_, rej) =>
          setTimeout(() => rej(new Error("Timeout getting session")), 8000)
        );

        const result = await Promise.race([supabase.auth.getSession(), timeout]);
        if (!mounted) return;

        const { data, error } = result;
        if (error) console.error("getSession error:", error);

        setSession(data?.session ?? null);
      } catch (e) {
        console.error("Session init failed:", e);
        setFatal(String(e?.message || e));
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    run();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const onLogout = async () => {
    await supabase.auth.signOut();
  };

  if (checkingSession) return <div style={{ padding: 20 }}>Cargando sesión...</div>;

  if (fatal) {
    return (
      <div style={{ padding: 20 }}>
        <h3>❌ Error</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{fatal}</pre>
      </div>
    );
  }

  if (!session) return <Login />;

  // Si tu Dashboard aún está en transición, por ahora evita romper todo:
  try {
    return <Dashboard session={session} onLogout={onLogout} />;
  } catch (e) {
    console.error("Dashboard crashed:", e);
    return (
      <div style={{ padding: 20 }}>
        <h3>Dashboard rompió</h3>
        <button onClick={onLogout}>Salir</button>
      </div>
    );
  }
}
