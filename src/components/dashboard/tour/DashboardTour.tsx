"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";

import { MARK_TOUR, ONBOARDING_STATE_QUERY } from "@/lib/graphql";
import type { DashboardView } from "@/lib/dashboardViews";
import { TourCard } from "./TourCard";
import { TOUR_STEPS } from "./steps";

/**
 * El tour del dashboard.
 *
 * Reemplaza a la versión con `driver.js`: eran tres o cinco focos sobre las
 * pestañas, con la mitad del recorrido escondido detrás de anclas opcionales, y
 * traía una dependencia entera para lo que aquí son treinta líneas de
 * `getBoundingClientRect` + un `box-shadow` de 9999px.
 *
 * `driver.js` sigue declarado en `package.json` y ya no lo importa nadie: se
 * quita en el siguiente `pnpm install` real (el pnpm de esta máquina no puede
 * regenerar el lockfile de este repo, y un package.json sin su lockfile rompe
 * los despliegues con `--frozen-lockfile`).
 *
 * El archivo es el motor, no el contenido. Su trabajo es: cambiar de vista,
 * medir el ancla, colocar la ficha donde no tape el hueco, y persistir el
 * resultado. Todo lo que cambia cuando el producto crece —cuántos pasos hay,
 * qué dicen, a qué apuntan— vive en `steps.ts` y en los `messages/*.json`.
 * Cómo añadir uno: `../continuity-mobile/docs/onboarding-tour.md`.
 *
 * Gemelo de `continuity-mobile/src/components/onboarding/tour/DashboardTour.tsx`.
 * Lo que cambia entre plataformas es **solo** cómo se recorta el velo: aquí un
 * `box-shadow` gigante, allá cuatro vistas, porque en React Native no hay
 * sombras de ese tamaño.
 */

const TOUR_PARAM = "tour";
/** Aire entre el borde del objetivo y el del recorte. El mismo que en la app. */
const PAD = 6;
/** Separación entre el hueco y la ficha. */
const GAP = 20;
const CARD_W = 400;
/** Por debajo de esto la ficha no cabe al lado del objetivo y se va arriba. */
const SIDE_MIN_W = 900;

type Rect = { top: number; left: number; width: number; height: number };
type State = { onboardingState: { tourStatus: string } } | undefined;

/**
 * Resuelve un `data-tour` al elemento **visible**.
 *
 * La barra lateral (`hidden md:flex`) y la barra inferior del móvil
 * (`md:hidden`) montan las dos con los mismos atributos. `querySelector`
 * devolvería la primera del DOM, que en móvil está en `display:none` — y el
 * recorte saldría fuera de la pantalla.
 */
function findVisible(name: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const el of nodes) {
    if (el.offsetParent !== null && el.getBoundingClientRect().width > 0) return el;
  }
  return null;
}

export function DashboardTour({
  onNavigate,
}: {
  /** Cambiar de vista. El tour enseña la sección de verdad, no una foto. */
  onNavigate: (view: DashboardView) => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("onboarding.tour");

  const { data } = useQuery<State>(ONBOARDING_STATE_QUERY, {
    fetchPolicy: "cache-first",
  });
  const [markTour] = useMutation(MARK_TOUR, {
    refetchQueries: [{ query: ONBOARDING_STATE_QUERY }],
  });

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(260);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);
  // Última vista a la que navegó el tour. `onNavigate` no tiene por qué ser
  // estable entre renders; sin esta guarda, el efecto volvería a navegar en
  // cada uno y el dashboard no pararía de re-renderizarse.
  const navRef = useRef<DashboardView | null>(null);

  const forced = params?.get(TOUR_PARAM) === "1";
  const tourStatus = data?.onboardingState?.tourStatus;

  useEffect(() => {
    if (startedRef.current) return;
    if (!forced && tourStatus !== "pending") return;
    startedRef.current = true;
    setIndex(0);
    setActive(true);
  }, [forced, tourStatus]);

  // ── Resolver el paso: cambiar de vista y medir ────────────────────────────
  const step = active ? TOUR_STEPS[index] : undefined;
  const anchor = step?.anchor;
  const view = step?.view;

  useEffect(() => {
    if (!active || !view) return;
    if (navRef.current === view) return;
    navRef.current = view;
    onNavigate(view);
  }, [active, view, onNavigate]);

  useEffect(() => {
    if (!active) return;
    if (!anchor) {
      setRect(null);
      return;
    }

    let raf = 0;
    let tries = 0;
    const measure = () => {
      const el = findVisible(anchor);
      if (!el) {
        // La vista puede estar montándose todavía. Si a los ~20 intentos
        // sigue sin aparecer (la barra inferior del móvil no lleva todas las
        // entradas), el paso se queda a pantalla completa: el texto es lo que
        // importa y no hace falta romper el recorrido por un ancla ausente.
        if (tries++ < 20) raf = requestAnimationFrame(measure);
        else setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    raf = requestAnimationFrame(measure);

    const onResize = () => {
      const el = findVisible(anchor);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, anchor, index]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [index, rect]);

  const close = useCallback(() => {
    setActive(false);
    setIndex(0);
    setRect(null);
    navRef.current = null;
    // Quitar ?tour=1 para que un refresco no lo relance.
    if (forced) router.replace("/dashboard");
  }, [forced, router]);

  const finish = useCallback(() => {
    markTour({ variables: { seen: true } }).catch(() => {});
    close();
  }, [markTour, close]);

  const skip = useCallback(() => {
    markTour({ variables: { seen: false } }).catch(() => {});
    close();
  }, [markTour, close]);

  const next = useCallback(() => {
    if (index < TOUR_STEPS.length - 1) setIndex(index + 1);
    else finish();
  }, [index, finish]);

  // Teclado: el tour es un diálogo modal y se maneja como tal.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") setIndex((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, skip, next]);

  if (!active || !step) return null;

  // ── Colocación de la ficha ────────────────────────────────────────────────
  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const minTop = 24;
  const maxTop = Math.max(minTop, vh - cardH - 24);
  const cardStyle: React.CSSProperties = { width: `min(${CARD_W}px, calc(100vw - 32px))` };

  if (!rect) {
    cardStyle.top = Math.max(minTop, (vh - cardH) / 2);
    cardStyle.left = Math.max(16, (vw - Math.min(CARD_W, vw - 32)) / 2);
  } else if (vw >= SIDE_MIN_W) {
    // Pantalla ancha: al lado del objetivo, que es donde está la barra lateral.
    const right = rect.left + rect.width + PAD + GAP;
    const left = rect.left - PAD - GAP - CARD_W;
    cardStyle.left = right + CARD_W <= vw - 16 ? right : Math.max(16, left);
    cardStyle.top = Math.min(Math.max(rect.top - 16, minTop), maxTop);
  } else {
    // Pantalla estrecha: el objetivo es la barra inferior, así que la ficha va
    // arriba de ella. El pulgar tapa la mitad de abajo del teléfono.
    const above = rect.top - PAD - GAP - cardH;
    const below = rect.top + rect.height + PAD + GAP;
    cardStyle.top = Math.min(Math.max(above >= minTop ? above : below, minTop), maxTop);
    cardStyle.left = 16;
  }

  return (
    <>
      {/* Atrapa los clics del resto de la página: durante el tour, lo único
          que se puede tocar es la ficha. */}
      <div aria-hidden="true" className="fixed inset-0 z-[59]" onClick={() => {}} />

      {rect ? (
        // El recorte: un `box-shadow` lo bastante grande como para cubrir la
        // pantalla entera menos el hueco. Es lo que en la app son cuatro vistas.
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[60] rounded-md border border-accent transition-[top,left,width,height] duration-150 ease-out motion-reduce:transition-none"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px var(--scrim)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 z-[60] bg-scrim" />
      )}

      <TourCard
        ref={cardRef}
        index={index}
        total={TOUR_STEPS.length}
        title={t(`${step.key}.title`)}
        body={t(`${step.key}.body`)}
        onNext={next}
        onBack={index > 0 ? () => setIndex((n) => n - 1) : undefined}
        onSkip={skip}
        style={cardStyle}
      />
    </>
  );
}
