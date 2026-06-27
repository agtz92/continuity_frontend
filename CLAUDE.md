# Frontend — notas para agentes

## Asistente "Loop"

El asistente IA se llama **Loop** (mascota de marca; mismo nombre en el repo móvil).
El rename vive en `messages/{es,en}.json` → `assistant.title:"Loop"`,
`assistant.buttonLabel:"Abrir Loop"/"Open Loop"`, `assistant.openTooltip`,
`assistant.message.working`. Se mantiene "Claude" en `assistant.subtitle` como
crédito del modelo. Las menciones **genéricas** de "asistente de IA" (pricing, legal,
tour) se dejan tal cual: describen la categoría de feature, no la persona.

**Acceso rápido a Loop (FAB):** `Dashboard.tsx` provee `AssistantLauncherProvider`
(`src/components/assistant/useAssistantLauncher.tsx`) con un `openAssistant()` único, para
no prop-drillear el estado del panel por las vistas. Dos puntos de entrada:
- **Mobile-web:** el FAB compartido (`src/components/ui/FAB.tsx`, `md:hidden`) es un
  **speed-dial** — al tocar `+` despliega la acción primaria de la vista + **"Abrir Loop"**
  (espejo del nativo). Los 6 call sites (`*View.tsx`) no cambian; el `+` lee `openAssistant`
  del context. El `className` (p.ej. el púrpura de Ideas) se aplica al botón principal.
- **Desktop:** `src/components/assistant/AssistantFab.tsx` (`hidden md:flex`, píldora
  flotante abajo-derecha) abre Loop. El header conserva además el `AssistantTrigger`
  (con `data-tour="assistant"`).

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
- **GraphQL** (`src/lib/graphql/feedback.ts`): `SUBMIT_BUG_REPORT` (usuario, `platform:"web"`), `ADMIN_BUG_REPORTS_QUERY`, `ADMIN_BUG_REPORTS_UNREAD_COUNT`, `ADMIN_BUG_REPORT_SET_STATUS`, `ADMIN_BUG_REPORT_DELETE`. Backend: app `core/feedback` (modelo `BugReport`). (Nota: `src/lib/graphql.ts` se partió en `src/lib/graphql/<dominio>.ts` + barrel `index.ts`; el import `@/lib/graphql` sigue igual.)

## Quick Notes — cuaderno tipo Notion (tab "notes" del dashboard)

Notas con **secciones plegables** (toggles), **categorizables** y ligables a un proyecto o sueltas. Es un tab más del dashboard (no una ruta propia), igual que Ideas. Plan/wireframes: `../docs/quick-notes/PLAN.md`. Backend: `backend/CLAUDE.md` (app `core`, GraphQL Strawberry).

- **Tab:** `"notes"` en `DashboardView` (`src/components/dashboard/TabBar.tsx`, icono `NotebookPen`) y en `MoreSheet.tsx` (mobile-web). Render en `Dashboard.tsx` cuando `view === "notes"`.
- **Vista:** `src/components/views/QuickNotesView.tsx`. Lista + **editor de dos paneles**; layout adaptable: sin nota abierta la lista ocupa ~`md:max-w-[75%]` en cuadrícula de 2 columnas; al abrir una nota colapsa a panel compacto (~22rem) + editor. Filtros: Todas / por categoría / Sueltas / Fijadas. Cierre del editor: ✕ en desktop, ← en móvil.
- **Sección:** `src/components/notes/NoteSectionBlock.tsx` — toggle plegable, guarda al perder foco, **drag & drop** con `@dnd-kit` (handle ⠿; el `DndContext`/`SortableContext` viven en `QuickNotesView`), botón **copiar al portapapeles** (`navigator.clipboard`, swap Copy→Check 1.5s) y **toggle vista/edición** (👁/✎). Las flechas ▲▼ se quitaron (el reorden es solo por arrastre).
- **Markdown:** `src/components/notes/MarkdownText.tsx` — renderer **propio sin dependencias** (encabezados, listas, **negrita**, *cursiva*, `código`, enlaces). En vista se renderiza; tocar para editar (textarea). Misma idea en móvil. ⚠️ El JSDoc del archivo **no** debe contener la secuencia `*/` (cierra el bloque): describe la sintaxis en prosa, no con asteriscos markdown.
- **Datos:** hooks `src/hooks/useQuickNotes.ts` (query lazy, `cache-and-network`) y `useQuickNoteMutations.ts` (refetch `QUICK_NOTES_QUERY`). Tipos `QuickNote`/`NoteSection` en `src/lib/types.ts`. GraphQL en `src/lib/graphql/quick-notes.ts` (carpeta `graphql/` por dominio; import `@/lib/graphql`).
- **i18n:** `views.quickNotes.*` (en/es). El acento usa el `accent` del tema (no púrpura hardcodeado como Ideas) para respetar la palette.
- **Onboarding:** el **tour** tiene un paso de Notes (`onboarding.tour.stepNotes`) en `DashboardTour.tsx`, **condicional** a que el tab sea visible (`findVisible("notes")`): aparece en desktop y se omite en mobile-web (ahí Notes vive en el `MoreSheet`). Requiere `data-tour="notes"` en `TabBar.tsx`. La nota de ejemplo para usuarios nuevos la siembra el backend (seed). Espejo en el repo móvil.

## Render: marketing ESTÁTICO vs herramienta DINÁMICA

> Resumen cross-repo del trabajo de performance (problema, cambios, resultados, pendientes):
> `../docs/marketing-performance.md`.

El sitio de marketing (`/`, `/blog`, `/[slug]` CMS, `/privacy`, `/terms`, `/welcome`,
`/resources` + `/recursos`) se sirve **estático (ISR)**; la herramienta (`/dashboard`,
`/admin/*`, `/settings/*`, `/onboarding`, `/login`, `/reset-password`, `/report-bug`)
es **dinámica**. Verifica con `next build`: marketing debe salir `○`/`●`, la herramienta `ƒ`.

**Regla de oro: el root layout (`src/app/layout.tsx`) NO debe leer cookies.** Leer cookies
ahí (lo hacía antes con `getLocale`/`getMessages`/`resolveTheme`/`resolvePalette`) contamina
TODA la app a dinámico y mata el prerender/ISR. Hoy el root es síncrono, `lang="en"` fijo, y
el **no-flash script** (`src/theme/no-flash.ts`) aplica `data-theme` **y `data-palette`** en
cliente desde cookies antes del paint (por eso el tool no necesita que el server lea cookies).

**Estructura de route groups** (los `(...)` no cambian la URL):
- `src/app/(marketing-en)/` — provider i18n con locale fijo `en` (mensajes vía `@/i18n/static`).
  Contiene `/`, blog, privacy, terms, welcome, `[slug]`, `resources/`.
- `src/app/(marketing-es)/` — provider `es` + `SetHtmlLang`. Contiene `es/*` (prefijo `/es`) y `recursos/`.
- `src/app/(app)/` — provider con locale de **cookie** (`getLocale`/`getMessages`) → dinámico.
  Contiene dashboard, settings, onboarding, admin, report-bug, login, reset-password.
- **Cada layout de marketing exporta `export const dynamic = "force-static"`** (cascada a sus
  páginas). next-intl opta las rutas a dinámico por defecto al usar su provider; esto las fuerza
  estáticas y, de paso, hace fallar el build si alguien mete una API dinámica (cookies/headers).

**i18n estático:** `src/i18n/static.ts` (`getMessagesFor`, `getStaticTranslator` vía
`createTranslator`) — request-independiente; NO uses `getTranslations`/`getLocale` (cookies) en
páginas de marketing. `src/i18n/request.ts` está endurecido: respeta un `locale` explícito y solo
lee cookies como fallback (para el tool). **URL = fuente de verdad del idioma** en marketing:
inglés en paths base, español bajo `/es` (resources mantiene `/resources` ↔ `/recursos`). El
switcher (`MarketingNav`) y los links internos navegan vía `src/i18n/marketingHref.ts`
(`marketingHref`/`switchLocalePath`), **ya no** vía cookie `setLocale`. hreflang/canonical en la
metadata de cada par en/es; el redirect "logueado → /dashboard" del home es client-side
(`RedirectIfAuthed`) para no leer sesión en server.

**Cuerpos compartidos** (patrón `ResourcePages.tsx`): `src/components/marketing/{LandingPage,
BlogIndex,BlogPost,LegalPage,CmsPage}.tsx` toman `locale` como prop; los archivos de ruta en/es
son wrappers delgados que pasan el locale fijo.

**Higiene del bundle de marketing (peso JS = lo que más pega en móvil/Safari iOS).** Las páginas
de marketing deben mantener su First Load JS bajo (~130 kB). Reglas para no regresar:
- **Apollo NO va en marketing.** `<Providers>` (ApolloProvider + Toaster) vive en
  `(app)/layout.tsx`, no en el root layout. Marketing trae su contenido por `publicGraphql` (fetch
  server-side), nunca por Apollo client.
- **No importar `@/lib/supabase` estático en componentes always-on de marketing** (nav, footer,
  shells). supabase-js pesa ~186 kB; cargarlo con `await import("@/lib/supabase")` dentro de un
  `useEffect` (ver `MarketingNav`/`RedirectIfAuthed`). La nav renderiza anónima primero y se
  actualiza al resolver la sesión.
- **No usar framer-motion en componentes always-on de marketing.** `MarketingNav` anima con CSS
  (`.ls-nav-enter` en globals.css) y `CTAButton` hace el scale hover/tap con
  `motion-safe:hover:scale-[...]`. framer solo en secciones del landing (Hero/Pricing/etc.), que
  no cargan en blog/resources/legal.
- **Imágenes: siempre `next/image`** para covers (no `<img>` crudo) y `lazyLoadContentImages`
  (`src/lib/contentHtml.ts`) para el HTML del cuerpo. Evita servir originales multi-MB.
