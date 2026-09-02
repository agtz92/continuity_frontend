# Onboarding · Paso 5 — Personalizar el Today view

> **Pagos, precios y suscripciones — fuente de verdad:** [Integración de pagos web y móvil](../../backend/docs/integracion-pagos-web-y-movil.md).
> Lo que este documento diga sobre Stripe, cobros, planes de pago o tiendas es
> contexto; ante cualquier diferencia, manda ese.

Paso final del onboarding (web **y** móvil) que presenta el editor del **Today
view** y lleva al usuario directo a él para mostrar/ocultar y reordenar
secciones. Mantiene la voz de marca del resto del onboarding (directo, informal,
"builder") y está localizado (en/es) en los dos clientes.

## Resumen del flujo

El onboarding pasa de **4 a 5 pasos**:

1. Nombre · 2. Tema · 3. Avatar · 4. Plan · **5. Personalizar Today** ← nuevo

El paso 4 (Plan) ya **no completa** el onboarding: su botón primario ahora
**avanza** al paso 5 (`onContinue`). La finalización (`completeOnboarding`) y el
CTA "ver el tour otra vez" se movieron al paso 5.

El paso 5 ofrece:

- **Primario "Personalizar Today"** → completa el onboarding y abre el editor de
  layout del Today directamente.
- **Secundario** → "Quizás después" (first-time, dispara el tour normal) o
  "Listo" (replay).
- **Replay** además muestra "Ver el tour del dashboard otra vez".

### Por qué el primario suprime el tour

Al elegir "Personalizar Today" se entra al editor del Today. El dashboard tour
(driver.js en web; overlay montado en el layout en móvil) arranca solo cuando
`tourStatus === "pending"`, así que **colisionaría** con el editor. Por eso la
ruta de personalizar marca el tour como visto/omitido (`markTour(seen:false)`)
en first-time. La ruta "Quizás después" deja el tour intacto y se dispara normal.

La ruta de **plan de pago** (Stripe Checkout) sale del flujo por completo
(completa + redirige a Stripe), así que **no** ve el paso 5. Pueden personalizar
luego desde el engrane del Today.

## Cambios por capa

### Backend (`continuity_backend`)

- `core/services/onboarding.py`: `TOTAL_STEPS = 4 → 5`. La finalización se rige
  por `status`, no por el conteo de pasos, así que usuarios existentes en
  `current_step` menor siguen contando como completados. No requiere migración.

### Web (`continuity/frontend`)

- `src/app/onboarding/steps/Step5Customize.tsx` — **nuevo** componente del paso 5.
- `src/app/onboarding/OnboardingFlow.tsx` — `TOTAL_STEPS = 5`; `handleFinish`
  acepta `customize` (marca tour omitido + navega a `/dashboard?customize=1`);
  renderiza el paso 5; el paso 4 recibe `onContinue={() => goToStep(5)}`.
- `src/app/onboarding/steps/Step4Plan.tsx` — `onFinish` → `onContinue` (avanza al
  paso 5 en todas las ramas: beta, replay, free, decide-later y el fallback de
  pago). Se quitó el "watch tour again" (vive en el paso 5).
- `src/components/views/TodayView.tsx` — lee `?customize=1` una vez al montar,
  abre `layout.setEditMode(true)` y limpia el param (`router.replace`).

### Móvil (`continuity-mobile`)

- `src/components/onboarding/Step5Customize.tsx` — **nuevo** paso 5.
- `src/app/onboarding.tsx` — `TOTAL_STEPS = 5`; `finishWithCustomize()` (completa
  + `markTour(seen:false)` + `requestCustomize()` + navega a `/today`); el paso 4
  usa `onContinue={() => goToStep(5)}`.
- `src/components/onboarding/Step4Plan.tsx` — `onFinish`/`onWatchTour` →
  `onContinue`; botones relabel a `onboarding.continue`.
- `src/lib/tour.ts` — pub/sub `requestCustomize` / `consumeCustomizeRequest` /
  `subscribeCustomize` (espejo del de tour) para el hand-off cross-screen.
- `src/app/(dashboard)/today.tsx` — consume el flag al montar y abre el editor.

## i18n

Bloque nuevo `onboarding.step5` en los **cuatro** archivos
(`{frontend/messages,mobile/src/messages}/{en,es}.json`):

| key       | en                         | es                          |
| --------- | -------------------------- | --------------------------- |
| `heading` | Make Today yours.          | Haz tuyo el Today.          |
| `sub`     | Counters, focus, routines… | Contadores, foco, rutinas…  |
| `hint`    | It's the gear at the top…  | Es el engrane arriba…       |
| `primary` | Personalize Today          | Personalizar Today          |
| `later`   | Maybe later                | Quizás después              |

Reutiliza claves existentes: `onboarding.continue`, `onboarding.back`,
`onboarding.replay.finishButton`, `onboarding.replay.replayTourButton`.

> Recordatorio móvil: ICU de **llave simple** (`{name}`), nunca `{{name}}`.

## Gotcha — el efecto de "resume" debe correr una sola vez

`OnboardingFlow.tsx` (web) tiene un `useEffect` que reanuda el paso desde el
`current_step` del server. **Debe** correr solo en el primer hydrate (guardado
con `resolvedRef`). Cada mutación de paso (`updateProfile`,
`updateNotificationSettings`, `setStep`) lleva
`refetchQueries: [ONBOARDING_STATE_QUERY]`; sin la guarda, el efecto se re-dispara
en cada refetch y re-aplica el `current_step` del server **encima** del paso
local optimista. Esos refetches compiten (la mutación de datos no avanza
`current_step`; solo `setStep` lo hace), así que un refetch viejo que aterriza
tarde puede **regresar la UI a un paso anterior** —a veces hasta el paso 1
(default del modelo). El flujo móvil ya lo guardaba con `resolved.current`; la web
no, y de ahí venía el glitch intermitente al avanzar (p. ej. al elegir avatar).

### Repro exacto: "avatar distinto reinicia, mismo avatar avanza"

El detonante NO es un remount. Es el efecto sin guarda re-ejecutándose cuando
cambia `data`, y `data` **solo cambia cuando el valor del avatar cambia de verdad**:

- `updateProfile({avatar})` lleva `refetchQueries: [ONBOARDING_STATE_QUERY]`.
- **Avatar distinto** → el refetch trae datos distintos → Apollo emite un nuevo
  `data` → el efecto (sin guarda) se re-dispara → en replay hace `setStepLocal(1)`
  → **reinicia**.
- **Mismo avatar** → el refetch trae datos idénticos → la `InMemoryCache`
  **deduplica** (misma referencia) → `data` no cambia → el efecto **no** corre →
  **avanza**.

La guarda `resolvedRef` (correr el resume una sola vez) **mata esto**: aunque
`data` cambie al elegir otro avatar, el efecto entra y sale de inmediato sin tocar
el step. Es el mismo bug del efecto sin guarda; el avatar solo era *qué* refetch
producía el cambio de `data` en replay.

### Segunda capa — `sessionStorage`

Como defensa en profundidad (y para reanudar tras un reload), el paso también vive
en `sessionStorage` (`continuity.onboarding.step`): `goToStep` lo escribe, el
resume lo restaura **antes** de los defaults de replay/server, y se limpia al salir
(finish/skip/redirect de cuenta ya completada). Per-tab y efímero. Si en el futuro
algo sí llegara a re-montar `OnboardingFlow`, esta capa evita el reinicio.

> Si el glitch persiste tras estos cambios, verifica que el frontend esté
> **reconstruido/redeployado**: el síntoma es idéntico a correr un build previo a
> la guarda de resume.

## Gotcha — el tema/paleta del onboarding debe escribir las cookies (web)

En web, la **fuente de verdad del SSR** para tema/paleta son las cookies
`NEXT_THEME` / `NEXT_PALETTE` (`theme/resolve.ts`, `palette/resolve.ts`; default
`continuuit` / `default`). El backend (`NotificationSettings.theme/palette`) es la
fuente cross-device que los sync hooks (`useThemeSync`/`usePaletteSync`)
reconcilian a la cookie **una vez por sesión**.

El onboarding (paso 2) guardaba el tema **solo en el backend** (vía
`updateNotificationSettings`), pero no seteaba las cookies. Resultado: al terminar
y caer al dashboard, el SSR leía la cookie ausente → default `continuuit` → el
tema elegido **se revertía** visiblemente.

Fix: el `onNext` del paso 2 en `OnboardingFlow.tsx` ahora escribe
`NEXT_THEME`/`NEXT_PALETTE` (cookie cliente, síncrono) y dispara los server
actions `setTheme`/`setPalette` (revalidan el layout) — exactamente como
`ThemeSelector`/`PaletteSelector`. Así el SSR del dashboard ya pinta el tema
correcto y persiste en reloads.

> **Mobile no aplica:** su `Step2Theme` usa `setTheme`/`setPalette` del
> `ThemeProvider`, que persisten en `AsyncStorage` (la fuente de verdad en mobile).
> No hay cookies ni SSR, así que ya persistía bien.

