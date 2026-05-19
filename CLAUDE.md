# Frontend — notas para agentes

## Tailwind: opacidad sobre colores del tema

**No uses `bg-accent/40`, `text-accent/60`, etc. con los colores del tema** (`accent`, `accent-2`, `bg`, `surface`, `border`, `text`, `text-muted`). En este setup **no se procesan correctamente** y la regla se ignora visualmente — el hover/bg se ve como si la clase no existiera.

Causa: en `tailwind.config.ts` los colores del tema están declarados como `"var(--accent)"`, y las variables CSS en `globals.css` guardan valores **hex** (`#4f46e5`, no `<r> <g> <b>`). Tailwind 3.4 no puede aplicar opacidad alfa sobre un hex envuelto en `var()` con la sintaxis `/<n>`.

### Cómo aplicar opacidad sobre un color del tema

Usa el arbitrary value con `color-mix()`:

```tsx
// ❌ Se ve invisible (clase no surte efecto visual)
className="hover:bg-accent/15"

// ✅ Funciona en cualquier palette/tema
className="hover:bg-[color-mix(in_srgb,var(--accent)_15%,transparent)]"
```

Aplica a `--accent`, `--accent-2`, `--bg`, `--surface`, `--border`, `--text`, `--text-muted`.

### Cuándo SÍ funciona `color/<n>`

Con colores de la paleta de Tailwind (no del tema): `bg-red-500/20`, `bg-amber-500/40`, etc. Esos no pasan por variables CSS y aplican opacidad sin problema. Úsalos para badges con semántica fija (overdue rojo, idle ámbar) — no para hover/estados que deban respetar palette del usuario.

### Colores sólidos del tema (sin opacidad) — siempre OK

`bg-border`, `bg-surface`, `bg-bg`, `text-text-muted`, etc. funcionan tal cual.

## Package manager

Usa `pnpm`, no `npm`. `npm install` rompe por el workspace protocol.
