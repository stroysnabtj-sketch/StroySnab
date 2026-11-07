"use client";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
  type SelectHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import styles from "./custom-select.module.css";
type Option = { value: string; label: string; disabled: boolean; group?: string };
function plain(node: ReactNode): string {
  return Children.toArray(node)
    .map((n) =>
      typeof n === "string" || typeof n === "number"
        ? String(n)
        : isValidElement<{ children?: ReactNode }>(n)
          ? plain(n.props.children)
          : "",
    )
    .join("");
}
function optionsFrom(children: ReactNode, group?: string, disabled = false): Option[] {
  return Children.toArray(children).flatMap((node) => {
    if (!isValidElement(node)) return [];
    const e = node as ReactElement<{
      children?: ReactNode;
      value?: string | number;
      disabled?: boolean;
      label?: string;
    }>;
    if (e.type === "optgroup")
      return optionsFrom(e.props.children, e.props.label, disabled || !!e.props.disabled);
    if (e.type === "option")
      return [
        {
          value: String(e.props.value ?? plain(e.props.children)),
          label: e.props.label || plain(e.props.children),
          disabled: disabled || !!e.props.disabled,
          group,
        },
      ];
    return optionsFrom(e.props.children, group, disabled);
  });
}
export function CustomSelect({
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const ariaLabel = props["aria-label"];
  const generated = useId(),
    id = props.id || `select-${generated}`,
    listId = `${id}-list`,
    native = useRef<HTMLSelectElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null),
    root = useRef<HTMLSpanElement>(null);
  const items = optionsFrom(children),
    [internal, setInternal] = useState(String(props.defaultValue ?? items[0]?.value ?? "")),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0),
    [label, setLabel] = useState<string | undefined>(),
    [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 280 });
  const value = props.value !== undefined ? String(props.value) : internal,
    selected = items.find((o) => o.value === value),
    enabled = items.map((o, i) => (!o.disabled ? i : -1)).filter((i) => i >= 0),
    search = useRef(""),
    lastKey = useRef(0);
  useEffect(() => {
    const field = native.current?.closest("label"),
      explicit = trigger.current?.labels?.[0];
    const text =
      field?.querySelector(".field-label")?.textContent ||
      explicit?.querySelector(".field-label")?.textContent;
    if (!ariaLabel && text) setLabel(text.trim());
  }, [ariaLabel, children]);
  useEffect(() => {
    if (!open) return;
    const locate = () => {
      const r = trigger.current?.getBoundingClientRect();
      if (!r) return;
      const below = innerHeight - r.bottom - 12,
        above = r.top - 12,
        up = below < 170 && above > below,
        space = Math.min(300, up ? above : below);
      setPosition({
        left: Math.max(8, Math.min(r.left, innerWidth - r.width - 8)),
        top: up ? r.top - Math.min(Math.max(80, space), items.length * 40 + 12) - 6 : r.bottom + 6,
        width: r.width,
        maxHeight: Math.max(80, space),
      });
    };
    locate();
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node) && !menu.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    window.addEventListener("resize", locate);
    window.addEventListener("scroll", locate, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", locate);
      window.removeEventListener("scroll", locate, true);
    };
  }, [open, items.length]);
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, listId]);
  useEffect(() => {
    const form = native.current?.form;
    const reset = () => setInternal(String(props.defaultValue ?? items[0]?.value ?? ""));
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  });
  function show() {
    if (props.disabled) return;
    setActive(
      Math.max(
        0,
        items.findIndex((o) => o.value === value && !o.disabled),
      ),
    );
    setOpen(true);
  }
  function choose(index: number) {
    const option = items[index],
      select = native.current;
    if (!option || option.disabled || !select) return;
    setInternal(option.value);
    select.value = option.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    setOpen(false);
    trigger.current?.focus();
  }
  function keydown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      if (!open) {
        show();
        return;
      }
      const n = enabled.indexOf(active);
      setActive(
        e.key === "Home"
          ? enabled[0]
          : e.key === "End"
            ? enabled.at(-1)!
            : enabled[(n + (e.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length],
      );
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(active);
      else show();
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const now = Date.now();
      search.current = (now - lastKey.current > 700 ? "" : search.current) + e.key.toLowerCase();
      lastKey.current = now;
      const found = items.findIndex(
        (o) => !o.disabled && o.label.toLowerCase().startsWith(search.current),
      );
      if (found >= 0) {
        if (!open) show();
        setActive(found);
      }
    }
  }
  if (props.multiple || (props.size && props.size > 1))
    return (
      <select {...props} className={`input ${className}`}>
        {children}
      </select>
    );
  return (
    <span ref={root} className={styles.root}>
      <button
        ref={trigger}
        type="button"
        id={id}
        role="combobox"
        aria-label={ariaLabel ?? label}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        aria-required={props.required}
        aria-invalid={props["aria-invalid"]}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={props.disabled}
        className={`input ${styles.trigger} ${className}`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={keydown}
      >
        <span>{selected?.label || props.title || "Выберите"}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <select
        {...props}
        ref={native}
        id={`${id}-native`}
        className={styles.native}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          setInternal(e.target.value);
          props.onChange?.(e);
        }}
        onInvalid={(e) => {
          e.preventDefault();
          trigger.current?.focus();
          props.onInvalid?.(e);
        }}
      >
        {children}
      </select>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menu}
            id={listId}
            role="listbox"
            aria-label={ariaLabel ?? label ?? "Варианты"}
            className={styles.menu}
            style={{ position: "fixed", ...position }}
          >
            {items.map((option, i) => (
              <div
                key={`${option.value}-${i}`}
                id={`${listId}-${i}`}
                role="option"
                aria-label={option.label}
                data-value={option.value}
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                data-active={active === i}
                className={styles.option}
                onPointerMove={() => !option.disabled && setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
              >
                {option.group && (i === 0 || items[i - 1].group !== option.group) && (
                  <small>{option.group}</small>
                )}
                <span>{option.label}</span>
                {option.value === value && <Check size={15} aria-hidden="true" />}
              </div>
            ))}
          </div>,
          root.current?.closest("dialog[open]") ?? document.body,
        )}
    </span>
  );
}
