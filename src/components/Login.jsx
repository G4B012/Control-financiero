import React, { useState } from "react";
import { motion } from "framer-motion";
import supabase  from "../lib/supabase";

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (isRegister) {
      // REGISTRO
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErr(error.message);
        return;
      }

      setMsg("Usuario registrado. Ahora puedes iniciar sesión.");
      setIsRegister(false);
    } else {
      // LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErr("Correo o contraseña incorrectos.");
        return;
      }

      setMsg("Sesión iniciada. Cargando...");
    }
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
          <div className="text-wine text-2xl font-extrabold">
            Control Financiero
          </div>
          <div className="text-sm text-wine2 mt-1">
            {isRegister ? "Registro" : "Acceso"}
          </div>
        </div>

        <div className="cardBody">
          <form onSubmit={submit} className="space-y-3">
            <div>
              <div className="label mb-1">Correo</div>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Coloque su correo"
              />
            </div>

            <div>
              <div className="label mb-1">Clave</div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la clave"
              />
            </div>

            {err && (
              <div className="text-sm text-red-700 font-semibold">{err}</div>
            )}

            {msg && (
              <div className="text-sm text-green-700 font-semibold">{msg}</div>
            )}

            <button className="btnRed w-full" type="submit">
              {isRegister ? "Registrarse" : "Entrar"}
            </button>
          </form>

          <div className="text-center mt-4 text-sm">
            {isRegister ? (
              <span>
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => setIsRegister(false)}
                  className="text-red-600 font-semibold"
                >
                  Inicia sesión
                </button>
              </span>
            ) : (
              <span>
                ¿No tienes cuenta?{" "}
                <button
                  onClick={() => setIsRegister(true)}
                  className="text-red-600 font-semibold"
                >
                  Regístrate
                </button>
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
