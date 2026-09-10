import type { ReactNode } from "react";
import { Meta } from "./Meta";

/**
 * La acción primaria de un vacío. Vive aquí para que las ocho pantallas no
 * tengan ocho botones ligeramente distintos.
 */
export function EmptyStateAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-md bg-accent text-bg font-medium text-sm transition-colors duration-150 ease-out hover:bg-accent-hi"
    >
      {label}
    </button>
  );
}

/**
 * Estado vacío con voz de marca: regla de 3px arriba, titular en display y un
 * cuerpo que dice algo. **Sin ilustración de stock** — el sistema no tiene
 * ilustración, y un vacío con dibujo se lee como error de otra app.
 *
 * `rule` es el metadato opcional del pie (p. ej. "último blocker resuelto hace
 * 2 d"): un dato honesto, no un consejo.
 */
export function EmptyState({
  title,
  body,
  actions,
  rule,
  className = "",
}: {
  title: string;
  body?: ReactNode;
  actions?: ReactNode;
  rule?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`py-12 ${className}`}>
      <span aria-hidden="true" className="block w-12 h-[3px] bg-accent" />
      <h2 className="mt-6 font-display-app text-[30px] leading-[1.05] tracking-[-0.03em] font-bold text-text max-w-[24ch]">
        {title}
      </h2>
      {body && <p className="mt-3 text-[15px] leading-[1.6] text-text-3 max-w-[52ch]">{body}</p>}
      {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
      {rule && (
        <Meta variant="cintillo" tone="faint" className="mt-8 block">
          {rule}
        </Meta>
      )}
    </div>
  );
}
