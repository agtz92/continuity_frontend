# Revisión de billing — hallazgos

> **Pagos, precios y suscripciones — fuente de verdad:** [Integración de pagos web y móvil](../../backend/docs/integracion-pagos-web-y-movil.md).
> Lo que este documento diga sobre Stripe, cobros, planes de pago o tiendas es
> contexto; ante cualquier diferencia, manda ese.

> **Estado: cerrado (2026-08-05).** Los tres riesgos que quedaron señalados aquí
> se arreglaron al integrar los pagos in-app, porque una segunda fuente de cobro
> los volvía probables en vez de teóricos. Abajo se conserva el diagnóstico
> original —sigue siendo la mejor explicación de *por qué* fallaban— con la
> resolución de cada uno.

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

> ✅ **Resuelto.** Se aplicó exactamente esa mitigación en `page.tsx`: el
> `router.replace` corre **antes** de irse a Stripe. El efecto además ignora las
> cuentas con `store_managed`, para no vender por Stripe a quien ya paga en una
> tienda.

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

> ✅ **Resuelto, y el diagnóstico se quedó corto.** Con tres emisores escribiendo
> la misma fila esto dejaba de ser un caso raro, así que en vez de parchear la
> rama se movió *toda* la escritura a `core/billing/entitlements.py`.
> `sync_subscription_to_profile` ya sólo traduce el evento de Stripe y delega; el
> guard es simétrico para todas las ramas y todas las fuentes. El caso que
> preocupaba —bloquear un upgrade legítimo— se resuelve por duración, no por
> orden de llegada: si la titularidad entrante corre más tiempo, toma el control
> y la desplazada queda en el audit log para cancelarla y reembolsarla.
> Cubierto por `core/billing/tests/test_entitlements.py`.

### 3. Fragilidad ante upgrade de la API de Stripe

Los webhooks y `cancel_subscription` leen `sub.get("current_period_end")` del
objeto subscription. Con `stripe==11.4.1` (API `2024-12-18.acacia`, sin pin
explícito en `stripe_client.py`) ese campo **existe**, así que hoy funciona. En
API `2025-03-31.basil`+ ese campo **se movió a los items** de la subscription, y
`plan_renews_at` quedaría en `None` silenciosamente. Si algún día se sube el SDK
o se fija una `api_version` más nueva, leer `current_period_end` desde
`items.data[0]` en vez del root.

> ✅ **Resuelto por los dos lados.** `stripe_client.py` ahora **fija**
> `api_version` (vía `STRIPE_API_VERSION`), así que subir el SDK ya no cambia la
> forma de los objetos por accidente; y `period_end_from_subscription()` lee
> **ambas** formas —raíz e items, tomando el vencimiento más lejano cuando hay
> varios—, así que subir el pin es seguro. La usan el webhook de Stripe y
> `cancel_subscription`.
