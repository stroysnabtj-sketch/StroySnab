"use client";
import styles from "./cart-flight.module.css";

const pulses = new WeakMap<HTMLElement, Animation>();
function visible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < innerHeight &&
    rect.left < innerWidth &&
    getComputedStyle(element).visibility !== "hidden"
  );
}

function pulse(element: HTMLElement) {
  if (!visible(element) || !element.animate) return;
  pulses.get(element)?.cancel();
  const animation = element.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.14)" }, { transform: "scale(1)" }],
    { duration: 250, easing: "ease-out" },
  );
  pulses.set(element, animation);
  void animation.finished
    .catch(() => {})
    .finally(() => {
      if (pulses.get(element) === animation) pulses.delete(element);
    });
}

// Snapshot computed styles so a copy keeps its appearance outside the catalog/gallery layout.
function visualCopy(source: HTMLElement) {
  const clone = source.cloneNode(true) as HTMLElement;
  const originals = [source, ...source.querySelectorAll<HTMLElement>("*")];
  const copies = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
  const ids = new Map<string, string>();
  const prefix = `cart-flight-${crypto.randomUUID()}`;
  copies.forEach((copy, index) => {
    const computed = getComputedStyle(originals[index]);
    for (const property of computed)
      copy.style.setProperty(property, computed.getPropertyValue(property));
    copy.style.animation = "none";
    copy.style.transition = "none";
    if (copy.id) {
      const id = `${prefix}-${index}`;
      ids.set(copy.id, id);
      copy.id = id;
    }
    copy.removeAttribute("autofocus");
  });
  copies.forEach((copy) => {
    for (const attribute of [...copy.attributes]) {
      let value = attribute.value;
      for (const [oldId, newId] of ids) {
        value = value.replaceAll(`url(#${oldId})`, `url(#${newId})`);
        if ((attribute.name === "href" || attribute.name === "xlink:href") && value === `#${oldId}`)
          value = `#${newId}`;
      }
      if (value !== attribute.value) copy.setAttribute(attribute.name, value);
    }
  });
  Object.assign(clone.style, {
    margin: "0",
    width: "100%",
    height: "100%",
    transform: "none",
    position: "relative",
    top: "0",
    left: "0",
    opacity: "1",
  });
  return clone;
}

export function flyToCart(source: HTMLElement | null, fallback?: HTMLElement | null) {
  if (!source || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let flight: HTMLDivElement | undefined;
  try {
    const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find(visible);
    if (!target || !visible(source) || !source.animate) {
      pulse(fallback ?? source);
      return;
    }
    const from = source.getBoundingClientRect(),
      to = target.getBoundingClientRect();
    const startX = from.left + from.width / 2,
      startY = from.top + from.height / 2;
    const endX = to.left + to.width / 2,
      endY = to.top + to.height / 2;
    const controlX = (startX + endX) / 2,
      controlY = Math.min(startY, endY) - Math.min(160, innerHeight * 0.2);
    flight = document.createElement("div");
    const activeFlight = flight;
    flight.className = styles.flight;
    flight.dataset.cartFlight = "";
    flight.setAttribute("aria-hidden", "true");
    flight.inert = true;
    Object.assign(flight.style, {
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
    });
    flight.append(visualCopy(source));
    document.body.append(flight);
    const frames = Array.from({ length: 9 }, (_, index) => {
      const t = index / 8;
      const x = (1 - t) ** 2 * startX + 2 * (1 - t) * t * controlX + t ** 2 * endX;
      const y = (1 - t) ** 2 * startY + 2 * (1 - t) * t * controlY + t ** 2 * endY;
      return {
        offset: t,
        transform: `translate(${x - startX}px, ${y - startY}px) scale(${1 - 0.94 * t})`,
        opacity: t < 0.75 ? 0.94 : (0.94 * (1 - t)) / 0.25,
      };
    });
    const animation = flight.animate(frames, {
      duration: 780,
      easing: "cubic-bezier(.4,0,.2,1)",
      fill: "forwards",
    });
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", cleanup);
      activeFlight.remove();
    };
    const timer = window.setTimeout(cleanup, 1200);
    window.addEventListener("pagehide", cleanup, { once: true });
    void animation.finished.then(() => {
      cleanup();
      if (target.isConnected) pulse(target);
    }, cleanup);
  } catch {
    flight?.remove();
    // A decorative effect must never change the successful cart mutation.
  }
}
