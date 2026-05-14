"use client";

import { Fragment, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * Renders a list capped at `initialCount` with a "Show N more / Show less"
 * toggle when there are hidden items. The toggle button stops event propagation
 * so it can be used safely inside a clickable parent (e.g. a project card).
 *
 * Caller is responsible for spacing / wrapping; this component renders a
 * fragment so it adopts the parent's layout (flex/grid/space-y).
 */
export function ShowMoreList<T>({
  items,
  initialCount = 5,
  renderItem,
  itemKey,
  toggleClassName = "text-xs text-accent hover:opacity-80 mt-1 inline-flex items-center gap-1",
}: {
  items: T[];
  initialCount?: number;
  renderItem: (item: T, index: number) => ReactNode;
  /** Stable key per item. */
  itemKey: (item: T, index: number) => string;
  toggleClassName?: string;
}) {
  const tCommon = useTranslations("common");
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? items : items.slice(0, initialCount);
  const hidden = items.length - initialCount;

  return (
    <>
      {visible.map((item, idx) => (
        <Fragment key={itemKey(item, idx)}>{renderItem(item, idx)}</Fragment>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowAll((s) => !s);
          }}
          className={toggleClassName}
        >
          {showAll ? tCommon("showLess") : tCommon("showMore", { count: hidden })}
        </button>
      )}
    </>
  );
}
