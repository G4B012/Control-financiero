import React, { useEffect, useState } from "react";
import supabase from "./lib/supabase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [session, setSession] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Detectar sesión automáticamente
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 🔥 Cargar movimientos cuando hay sesión
  useEffect(() => {
    const fetchMovimientos = async () => {
      if (!session?.user) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("movimientos")
        .select("*")
        .eq("user_id", session.user.id);

      if (!error) {
        setMovimientos(data);
      } else {
        console.error(error);
      }

      setLoading(false);
    };

    fetchMovimientos();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) return <Login />;

  if (loading) return <div>Cargando...</div>;

  return (
    <Dashboard
      movimientos={movimientos}
      session={session}
      onLogout={handleLogout}
    />
  );
}