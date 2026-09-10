"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import type { DashboardView } from "@/lib/dashboardViews";
import { Meta } from "@/components/ui/Meta";

/**
 * La barra lateral del rediseño (S13).
 *
 * Tres decisiones del diseño que van en serio:
 *
 * - **Sin iconos.** Diez iconos en columna se convierten en ruido decorativo;
 *   la palabra dice más y más rápido. Solo el colapso lleva icono, porque ahí
 *   no hay palabra.
 * - **El activo se marca con la espina**, no con un fondo. Es la misma firma de
 *   3px que usan las filas: si el sistema dice "estado" con una barra a la
 *   izquierda, la navegación también.
 * - **Los contadores son metadato, no alarma.** Van en versalitas apagadas.
 *   El único que se enciende es el de atorados, con su ✕ — porque es el único
 *   que pide que hagas algo.
 *
 * Colapsa a 64px con ⌘\ y recuerda el estado en `localStorage`. Colapsada
 * enseña las dos primeras letras: el mismo código de dos letras que usan los
 * chips de categoría, así que el ojo ya sabe leerlo.
 */

const COLLAPSE_KEY = "continuity:sidebar-collapsed";

export interface SidebarCounts {
  projects: number;
  tasks: number;
  routines: number;
  ideas: number;
  notes: number;
  /** Proyectos con al menos un blocker abierto. El único contador con color. */
  blocked: number;
}

type Item = { view: DashboardView; counter?: keyof SidebarCounts };
type Group = { labelKey: string; items: Item[] };

/**
 * Los tres grupos del artboard. **Tareas, Rutinas y Calendario siguen siendo
 * destinos propios**, agrupados bajo "Hacer" — el diseño los quería como
 * lentes dentro de un único destino, pero eso borra tres URLs reales y dos
 * deep links de la app nativa. Se queda la agrupación visual, que es lo que
 * ordena la lista, sin la fusión, que es lo que rompe cosas.
 */
const GROUPS: Group[] = [
  {
    labelKey: "work",
    items: [
      { view: "today" },
      { view: "projects", counter: "projects" },
    ],
  },
  {
    labelKey: "do",
    items: [
      { view: "tasks", counter: "tasks" },
      { view: "routines", counter: "routines" },
      { view: "calendar" },
    ],
  },
  {
    labelKey: "material",
    items: [
      { view: "ideas", counter: "ideas" },
      { view: "notes", counter: "notes" },
      { view: "log" },
    ],
  },
  {
    labelKey: "reading",
    items: [{ view: "analytics" }, { view: "graveyard" }],
  },
];

/** Los cuatro anclajes que el tour de onboarding necesita encontrar. */
const TOUR_ANCHORS = new Set<DashboardView>([
  "projects",
  "tasks",
  "routines",
  "notes",
]);

export function Sidebar({
  view,
  counts,
  onChange,
  onQuickCapture,
}: {
  view: DashboardView;
  counts: SidebarCounts;
  onChange: (v: DashboardView) => void;
  onQuickCapture: () => void;
}) {
  const t = useTranslations("tabs");
  const tNav = useTranslations("nav");
  const [collapsed, setCollapsed] = useState(false);

  // El estado inicial se lee tras montar, no durante el render: en SSR no hay
  // localStorage y leerlo en el primer render desincroniza la hidratación.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // Ventana privada o almacenamiento bloqueado: se queda desplegada.
    }
  }, []);

  const toggle = () =>
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // No poder recordarlo no debe impedir colapsarla.
      }
      return next;
    });

  // ⌘\ / Ctrl+\ colapsa. No se captura si hay un campo con el foco.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "\\" || !(e.metaKey || e.ctrlKey)) return;
      const el = document.activeElement;
      if (
        el instanceof HTMLElement &&
        (el.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))
      ) {
        return;
      }
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <nav
      aria-label={tNav("aria")}
      className={`hidden md:flex flex-col shrink-0 border-r border-line-08 py-4 transition-[width] duration-150 ease-out ${
        collapsed ? "w-16" : "w-[248px]"
      }`}
    >
      <button
        type="button"
        onClick={onQuickCapture}
        title={`${tNav("quickCapture")} · ⌘K`}
        className={`mx-3 mb-5 px-3 py-2 rounded-md bg-accent-a12 border border-accent-a35 text-accent hover:bg-accent-a22 transition-colors duration-150 ease-out flex items-center ${
          collapsed ? "justify-center" : "justify-between gap-2"
        }`}
      >
        <span className="text-sm font-medium">
          {collapsed ? "+" : `+ ${tNav("quickCapture")}`}
        </span>
        {!collapsed && (
          <Meta variant="dato" tone="inherit">
            ⌘K
          </Meta>
        )}
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {GROUPS.map((group) => (
          <div key={group.labelKey} className="mb-5">
            {!collapsed && (
              <Meta variant="cintillo" tone="faint" className="block px-4 mb-1.5">
                {tNav(`groups.${group.labelKey}`)}
              </Meta>
            )}
            <ul>
              {group.items.map((item) => {
                const active = view === item.view;
                const label = t(item.view);
                const count = item.counter ? counts[item.counter] : 0;
                return (
                  <li key={item.view}>
                    <button
                      type="button"
                      onClick={() => onChange(item.view)}
                      aria-current={active ? "page" : undefined}
                      data-tour={
                        TOUR_ANCHORS.has(item.view) ? item.view : undefined
                      }
                      title={collapsed ? label : undefined}
                      className={`relative w-full flex items-center gap-2 py-1.5 transition-colors duration-150 ease-out ${
                        collapsed ? "justify-center px-0" : "px-4"
                      } ${active ? "text-text" : "text-text-4 hover:text-text-2"}`}
                    >
                      {/* La espina del activo: misma firma de 3px que las filas. */}
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent"
                        />
                      )}
                      <span
                        className={`flex-1 text-left text-sm truncate ${
                          collapsed ? "hidden" : ""
                        }`}
                      >
                        {label}
                      </span>
                      {collapsed ? (
                        <span className="text-[11px] uppercase tracking-wider">
                          {label.slice(0, 2)}
                        </span>
                      ) : (
                        count > 0 && (
                          <Meta variant="dato" tone="faint">
                            {count}
                          </Meta>
                        )
                      )}
                    </button>
                  </li>
                );
              })}
              {/* Atorados cuelga de "Proyectos": es donde se resuelve. Único
                  contador con color, y solo existe si hay alguno. */}
              {group.labelKey === "work" && counts.blocked > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => onChange("projects")}
                    title={tNav("blocked")}
                    className={`w-full flex items-center gap-1.5 py-1 text-signal hover:opacity-80 transition-opacity ${
                      collapsed ? "justify-center px-0" : "px-4"
                    }`}
                  >
                    <span aria-hidden="true" className="text-xs">
                      ✕
                    </span>
                    <Meta variant="cintillo" tone="inherit">
                      {collapsed ? counts.blocked : tNav("blocked")}
                    </Meta>
                    {!collapsed && (
                      <Meta variant="dato" tone="inherit" className="ml-auto">
                        {counts.blocked}
                      </Meta>
                    )}
                  </button>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? tNav("expand") : tNav("collapse")}
        title={`${collapsed ? tNav("expand") : tNav("collapse")} · ⌘\\`}
        className={`mx-3 mt-2 p-2 rounded-md text-text-4 hover:text-text transition-colors duration-150 ease-out flex ${
          collapsed ? "justify-center" : "justify-start"
        }`}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>
    </nav>
  );
}
