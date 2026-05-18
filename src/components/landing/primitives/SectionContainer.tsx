import { forwardRef } from "react";
import type { ReactNode, HTMLAttributes } from "react";

type Surface = "navy" | "cream" | "indigo" | "transparent";

type Props = HTMLAttributes<HTMLElement> & {
  id?: string;
  surface?: Surface;
  children: ReactNode;
  /** Add extra bottom-padding-zero when this section flows into the next. */
  flush?: boolean;
};

const surfaceClasses: Record<Surface, string> = {
  navy: "bg-ls-navy text-ls-text-primary",
  cream: "bg-ls-cream text-ls-text-on-cream",
  indigo: "bg-ls-indigo text-ls-text-primary",
  transparent: "",
};

const SectionContainer = forwardRef<HTMLElement, Props>(function SectionContainer(
  { id, surface = "navy", flush = false, className = "", children, ...rest },
  ref,
) {
  const padding = flush ? "pt-24 sm:pt-32 lg:pt-40 pb-0" : "py-24 sm:py-32 lg:py-40";
  return (
    <section
      ref={ref}
      id={id}
      className={`${surfaceClasses[surface]} ${padding} scroll-mt-20 relative overflow-hidden ${className}`}
      {...rest}
    >
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12">{children}</div>
    </section>
  );
});

export default SectionContainer;
