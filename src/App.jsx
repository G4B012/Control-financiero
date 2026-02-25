import React, { useState } from "react";
import { USERS } from "./authConfig";
import { loadState, saveState, freshState } from "./storage";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App(){
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem("cfp:session");
    return raw ? JSON.parse(raw) : null;
  });

  const user = session?.username;
  const [state, setState] = useState(() => (user ? loadState(user) : null));

  const setAndPersist = (updater) => {
    setState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveState(user, next);
      return next;
    });
  };

  const onLogin = ({ username }) => {
    localStorage.setItem("cfp:session", JSON.stringify({ username }));
    setSession({ username });
    setState(loadState(username));
  };

  const onLogout = () => {
    localStorage.removeItem("cfp:session");
    setSession(null);
    setState(null);
  };

  const onResetUser = () => {
    if (!user) return;
    const s = freshState(user);
    saveState(user, s);
    setState(s);
  };

  if (!session) return <Login users={USERS} onLogin={onLogin} />;
  return <Dashboard state={state} setState={setAndPersist} onLogout={onLogout} onResetUser={onResetUser} />;
}
