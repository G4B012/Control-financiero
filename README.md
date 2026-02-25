# Control Financiero Premium (Netlify) — v3

## ✅ Lo que ya está implementado
- Login simple: **Gabriel** y **Karla** (clave: **060625**)
- Meses con nombre: **Enero 2026**, etc.
- Meses futuros: se ven con 🔒 y se habilitan **15 días antes**
- Presupuestos se quedan **mes a mes** automáticamente:
  - Si pones **Categoría + Presupuesto**, se guarda como “plantilla” y se copia a meses siguientes.
  - Si borras una fila con presupuesto (✕), se “corta” desde ese mes hacia adelante.
  - Así tú solo registras el **Monto** cada mes.
- Tablas tipo “cards” (no tabla fea), filas aparecen según se necesiten (+ 1 fila vacía)
- Notas pequeñas **al lado** (no abajo)
- Ahorro: ahora tiene **nombre de meta** editable + progreso + historial visible
- Deuda: una sola deuda activa + pagos + historial visible
- Paleta más viva + animaciones (Framer Motion + hover + pop-in)

## Ejecutar en tu PC
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Subir a Netlify
### Recomendado: GitHub → Netlify
- Build command: `npm run build`
- Publish directory: `dist`

### Drag & Drop
1) `npm run build`
2) Arrastra `dist/` a Netlify.
