# Revisión de billing — hallazgos

Revisión del flujo de billing/Stripe (backend `core/billing`, web
`settings/billing`, móvil read-only). Un bug concreto **arreglado** y tres
riesgos **señalados** (tocan lógica de dinero/Stripe; no se cambiaron sin tu OK).

## ✅ Arreglado — el plan no se reflejaba al volver de Stripe Checkout

**Síntoma:** completas el pago, vuelves a `/settings/billing?status=success`, y la
página sigue mostrando **"Free" + las upgrade cards** hasta recargar.

**Causa:** `page.tsx` leía `usage` **una sola vez** al montar y, al volver con
`?status=success`, solo mostraba un toast. El plan real lo promueve el webhook
`checkout.session.completed`, que es **asíncrono** y compite con el redirect del
navegador (inmediato). La primera —y única— lectura casi siempre traía
`plan:"free"`.

**Fix:** al volver con `?status=success` se hace *polling* acotado de `getUsage()`
(inmediato + hasta 5 reintentos cada 2s) hasta que aparece la suscripción, y se
refresca la UI sin recargar. Guardado con un ref para correr una vez por retorno.
Archivo: `src/app/settings/billing/page.tsx`.

> Nota: a propósito **no** se limpia el query param `?status` en este effect —
> hacerlo cambia `params`, dispara el cleanup y mataría el polling a media
> ejecución.

## ⚠️ Señalados (requieren tu decisión — son lógica de cobro)

### 1. Back del navegador puede disparar un segundo checkout (doble cobro)

El auto-checkout (`?upgrade=pro&period=monthly` desde el landing) dispara
`createCheckout` cuando `plan === "free"`. Tras pagar, el `success_url` no trae
`upgrade`, así que no re-dispara. **Pero** si el usuario hace *Back* a la entrada
`?upgrade=...` del historial **antes** de que el webhook promueva el plan
(`plan` aún "free"), el effect dispara **otro** checkout → posible segunda
suscripción en paralelo. Stripe permite múltiples subs por customer, así que es
un doble cobro real.
**Mitigación sugerida (client-only, segura):** tras disparar el auto-checkout,
`router.replace("/settings/billing")` para borrar el param del historial.

### 2. `sync_subscription_to_profile`: la rama *activa* no tiene el guard `is_current_sub`

En `core/billing/services.py`, la rama terminal (cancel/unpaid) ignora eventos de
una sub **que no es la actual** (`is_current_sub`, línea ~201). La rama **activa**
(líneas ~233-250) **no** tiene ese guard: un `customer.subscription.updated`
(active) atrasado de una sub vieja puede **repuntar** `stripe_subscription_id` y
`plan` a la sub equivocada. Se compone con el riesgo #1 (que crea subs
paralelas). El modelo del producto es "una sola sub" (los pagos suben de plan por
el portal, que modifica la **misma** sub), así que en la práctica casi no pasa —
pero el guard debería ser simétrico. Es lógica delicada: **mejor confirmarlo
antes de tocar** (un guard ingenuo bloquearía un upgrade legítimo vía checkout
nuevo).

### 3. Fragilidad ante upgrade de la API de Stripe

Los webhooks y `cancel_subscription` leen `sub.get("current_period_end")` del
objeto subscription. Con `stripe==11.4.1` (API `2024-12-18.acacia`, sin pin
explícito en `stripe_client.py`) ese campo **existe**, así que hoy funciona. En
API `2025-03-31.basil`+ ese campo **se movió a los items** de la subscription, y
`plan_renews_at` quedaría en `None` silenciosamente. Si algún día se sube el SDK
o se fija una `api_version` más nueva, leer `current_period_end` desde
`items.data[0]` en vez del root.
