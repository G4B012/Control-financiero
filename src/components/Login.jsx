import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Login({ users, onLogin }){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const u = users.find(x => x.username === username && x.password === password);
    if (!u) return setErr("Usuario o clave incorrecta.");
    setErr("");
    onLogin({ username: u.username });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#fff4f4] via-white to-[#fff0ef]">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="card w-full max-w-md overflow-hidden"
      >
        <div className="cardHeader">
          <div className="text-wine text-2xl font-extrabold">Control Financiero</div>
          <div className="text-sm text-wine2 mt-1">Acceso</div>
        </div>
        <div className="cardBody">
          <form onSubmit={submit} className="space-y-3">
            <div>
              <div className="label mb-1">Usuario</div>
              <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Gabriel o Karla" />
            </div>
            <div>
              <div className="label mb-1">Clave</div>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="060625" />
            </div>
            {err && <div className="text-sm text-red-700 font-semibold">{err}</div>}
            <button className="btnRed w-full" type="submit">Entrar</button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
