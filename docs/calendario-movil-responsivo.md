# Calendario móvil responsivo (estilo iOS) — para espejar en mobile

Resumen del trabajo hecho en `continuity_frontend` para que las vistas de
**semana** y **mes** del calendario sean legibles en móvil, asemejando la
distribución de eventos del calendario de iOS. Replicar la misma idea (no
necesariamente el mismo código) en `continuity-mobile`.

## Problema

En móvil-web la vista de **semana** comprimía 7 columnas en el ancho del
teléfono (~40px cada una): los chips solo alcanzaban a mostrar números/iconos,
ilegibles. La vista de **mes** usaba los mismos chips con checkbox + badge, que
desperdician el ancho en celdas angostas.

## Solución (web)

### 1. Vista de semana — agenda vertical en móvil

`src/components/calendar/WeekGrid.tsx` ahora renderiza **dos layouts**:

- **Móvil (`md:hidden`)**: agenda vertical. Cada día es una **fila a ancho
  completo** = columna estrecha izquierda (día de semana abreviado + número de
  fecha; hoy en círculo `bg-accent`) + separador `border-l` + lista de chips
  legibles a la derecha. Días sin eventos muestran un `·` muted. La `LoadBar`
  (si `showLoad`) va al final de la fila, solo si `load.hours > 0`.
- **Desktop (`hidden md:grid grid-cols-7`)**: el grid clásico de 7 columnas,
  sin cambios respecto a antes.

La lógica de chips (rollups de proyecto / tareas / rutinas, respetando
`showTasks`) se extrajo a un helper local `dayChips(iso)` para que ambos
layouts queden en sync y no se dupliquen reglas.

### 2. Vista de mes — bloques de evento estilo iOS

`src/components/calendar/MonthGrid.tsx`:

- Reemplaza los chips interactivos (con checkbox/badge) por **bloques de evento
  compactos** (`EventBlock`): barra coloreada con **título** y, en segunda
  línea, la **hora** (cuando el item tiene hora). Sin controles inline: **tocar
  un evento abre el día** (`onPickDay`), igual que el "+N más". Esto mantiene
  legibles las celdas angostas y evita mis-taps en checkboxes diminutos.
- Color del bloque:
  - Tarea → color de la categoría del proyecto (`projectChipClass`), o tinte
    `accent-2` si no tiene proyecto/categoría.
  - Rollup de proyecto (modo default, sin `showTasks`) → color de categoría +
    `count` de tareas.
  - Rutina → `ROUTINE_CHIP` (tinte `accent`); si está completada, `strike`
    (line-through + opacidad).
- Celdas más altas para mejor visibilidad: `min-h-[104px] md:min-h-[112px]`
  (antes `min-h-[96px]`), `gap-0.5`.
- Se conserva `MAX_CHIPS = 3` y el botón "+N más" → abre el día.

### 3. Componentes y helpers nuevos

- `src/components/calendar/parts.tsx` → `EventBlock`: botón a ancho completo,
  `rounded-sm border`, título `text-[10px] truncate`, `count` opcional,
  `strike` opcional, y segunda línea de hora `text-[9px] opacity-70`. Recibe
  `colorClass` (reusa `projectChipClass` / `ROUTINE_CHIP`) y `onClick`.
- `src/lib/calendar.ts` → `formatTime(hms, locale)`: etiqueta de hora compacta
  y localizada a partir de `"HH:MM[:SS]"`. Devuelve `null` para all-day (sin
  hora). Omite los minutos cuando son `:00` (ej. "9 AM"; "10:45 a. m.").

## Notas de estilo (importantes al espejar)

- **Colores del tema vía `color-mix`** — nada hardcodeado; respeta la palette
  del usuario. Se reusan `projectChipClass` y `ROUTINE_CHIP` ya existentes.
- Badges con semántica fija (overdue/idle/load) siguen usando colores de la
  paleta de Tailwind (`red-500`, `amber-500`) como antes — no cambiaron.
- El breakpoint de corte web es `md`. En el repo móvil (nativo) el equivalente
  es: la **semana** debe ser una lista/agenda vertical por día (no un grid de 7
  columnas), y el **mes** debe mostrar bloques de evento (título + hora,
  coloreados por categoría) en vez de chips con controles; tocar abre el día.

## Archivos tocados (web)

- `src/components/calendar/WeekGrid.tsx` — agenda móvil + grid desktop.
- `src/components/calendar/MonthGrid.tsx` — bloques `EventBlock` + celdas altas.
- `src/components/calendar/parts.tsx` — nuevo `EventBlock`.
- `src/lib/calendar.ts` — nuevo `formatTime`.

Sin cambios de i18n (no se agregaron claves nuevas) ni de GraphQL/datos.
