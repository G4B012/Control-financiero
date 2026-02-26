import React, { useState, useEffect } from "react";
import { USERS } from "./authConfig";
import { supabase } from "./supabaseClient";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem("cfp:session");
    return raw ? JSON.parse(raw) : null;
  });

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = session?.username;

  // 🔥 Cargar datos desde Supabase cuando hay sesión
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("users") // ⚠️ Cambia si tu tabla se llama diferente
        .select("*")
        .eq("username", user)
        .single();

      if (error) {
        console.error("Error cargando usuario:", error);
      } else {
        setState(data);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const onLogin = ({ username }) => {
    localStorage.setItem("cfp:session", JSON.stringify({ username }));
    setSession({ username });
  };

  const onLogout = () => {
    localStorage.removeItem("cfp:session");
    setSession(null);
    setState(null);
  };

  const onResetUser = async () => {
    if (!user) return;

    const emptyState = {
      expenses: [],
      savings: [],
      debtPayments: []
    };

    await supabase
      .from("users")
      .update(emptyState)
      .eq("username", user);

    setState(emptyState);
  };

  const updateState = async (newState) => {
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update(newState)
      .eq("username", user);

    if (!error) {
      setState(newState);
    }
  };

  if (!session) return <Login users={USERS} onLogin={onLogin} />;

  if (loading || !state) return <div>Cargando...</div>;

  return (
    <Dashboard
      state={state}
      setState={updateState}
      onLogout={onLogout}
      onResetUser={onResetUser}
    />
  );
}