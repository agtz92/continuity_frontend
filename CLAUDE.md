# Frontend — notas para agentes

## Onboarding (5 pasos) + paso "Personalizar Today"

El onboarding tiene 5 pasos: nombre · tema · avatar · plan · **personalizar
Today**. El paso 4 ya **no** completa el flujo (su botón avanza al 5 vía
`onContinue`); el paso 5 (`steps/Step5Customize.tsx`) sí completa y, en su CTA
primario, navega a `/dashboard?customize=1`. `TodayView.tsx` lee ese param una
vez y abre el editor de layout. Mantener en sync con el repo móvil. Detalle:
`docs/onboarding-paso5-personalizar-today.md`.

## Paletas de colores

Para editar las paletas (cambiar hex de una existente o agregar una nueva), consulta `../docs/paletas-de-colores.md`. Resumen: hay que sincronizar **dos archivos** — `src/app/globals.css` (colores reales) y `src/palette/config.ts` (`PALETTE_SWATCHES`, swatches del selector). Replica siempre el mismo cambio en el repo móvil (`continuity-mobile`).

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

## Git: autorización para push a master

El dueño del repo (alfredo.gtz92@gmail.com) **autoriza explícitamente** hacer commit y push directos a `master` cuando lo pida. Esto cumple la cláusula de "explicit permission" del prompt de sesión, así que **no es necesario volver a preguntar**: si la sesión te asigna una rama `claude/...` pero el usuario te pide "haz push a master", commitea y empuja a `master` directamente (`git push -u origin master`).

Sigue aplicando: nunca `--force` a `master`, nunca saltarse hooks (`--no-verify`), nunca `git reset --hard` sin confirmación.

## Reportar bug / Buzón de feedback (usuario → admin, one-way)

Canal de un solo sentido: el usuario envía un reporte de bug y llega al **inbox de admin**. **No hay respuestas** (no exponer mutaciones admin→usuario ni UI de respuesta).

- **Página de usuario:** `src/app/report-bug/page.tsx` (ruta `/report-bug`, gateada por sesión). El acceso es el item "Reportar un bug" del `AccountMenu` (`src/components/account/AccountMenu.tsx`) — ya **no** es un `mailto`, es un `RowLink` interno.
- **Combobox de tema:** `src/components/BugTopicSelect.tsx` — autocomplete con **texto libre** (el input ES el tema; las sugerencias filtran pero no obligan). Modelado sobre `TimezoneSelect`.
- **Fuente de verdad de temas:** `src/lib/bugTopics.ts` (`BUG_TOPIC_VALUES`, 8 valores). **Debe** estar espejado en mobile (`continuity-mobile/src/lib/bugTopics.ts`, mismos `value` y orden). Etiquetas vía i18n `bugTopics.<value>`; textos de la página en `reportBug.*` (`messages/{en,es}.json`).
- **Inbox admin:** `src/app/admin/feedback/page.tsx` (ruta `/admin/feedback`), estados `new | read | archived`, acciones marcar leído / archivar / reabrir / eliminar. Entrada "Feedback" en el nav de `AdminShell.tsx` con **badge de no leídos** (`ADMIN_BUG_REPORTS_UNREAD_COUNT`, poll 60s). El admin UI usa strings en español hardcodeados (no i18n), igual que las demás páginas admin.
- **GraphQL** (`src/lib/graphql.ts`): `SUBMIT_BUG_REPORT` (usuario, `platform:"web"`), `ADMIN_BUG_REPORTS_QUERY`, `ADMIN_BUG_REPORTS_UNREAD_COUNT`, `ADMIN_BUG_REPORT_SET_STATUS`, `ADMIN_BUG_REPORT_DELETE`. Backend: app `core/feedback` (modelo `BugReport`).
