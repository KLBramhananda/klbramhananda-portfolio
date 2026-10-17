import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";

/**
 * One mechanical-keyboard keycap: a real <button> with a top face and a
 * visible bottom edge (layered box-shadow set per state, never animated) and
 * a pre-blurred underglow whose opacity fades in on hover. Lift / press move
 * only `transform`. All looks live in the `.keycap*` classes in styles.css.
 */
export function Keycap({
  label,
  dim,
  expanded,
  pressed,
  controls,
  onHover,
  onHoverEnd,
  onPress,
}: {
  label: string;
  dim: boolean;
  expanded: boolean;
  /** Pinned open: shows the pressed-down state. */
  pressed: boolean;
  controls?: string;
  onHover: (label: string, el: HTMLButtonElement) => void;
  onHoverEnd: () => void;
  /** Click, Enter or Space. `keyboard` is true when no pointer was involved. */
  onPress: (label: string, el: HTMLButtonElement, keyboard: boolean) => void;
}) {
  const enter = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse") onHover(label, e.currentTarget);
  };
  const click = (e: MouseEvent<HTMLButtonElement>) => {
    onPress(label, e.currentTarget, e.detail === 0);
  };
  const key = (e: KeyboardEvent<HTMLButtonElement>) => {
    // Space on a button clicks on keyup; press it on keydown like a real key.
    if (e.key === " ") {
      e.preventDefault();
      onPress(label, e.currentTarget, true);
    }
  };
  return (
    <button
      type="button"
      data-skill
      data-dim={dim ? "" : undefined}
      data-pressed={pressed ? "" : undefined}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-controls={expanded ? controls : undefined}
      onPointerEnter={enter}
      onPointerLeave={onHoverEnd}
      onClick={click}
      onKeyDown={key}
      className="keycap"
    >
      <span aria-hidden className="keycap__glow" />
      <span className="keycap__top">{label}</span>
    </button>
  );
}
