const MARK: Record<string, string> = {
  "🟩": "green",
  "🟨": "yellow",
  "🟧": "orange",
  "🟥": "red",
  "🟦": "blue",
  "🟢": "green",
  "🟡": "yellow",
  "🟠": "orange",
  "🔴": "red",
  "🔵": "blue",
};
const PREFIX = /^(🟩|🟨|🟧|🟥|🟦|🟢|🟡|🟠|🔴|🔵)\s*/u;
const EDGE: Record<string, string> = {
  green: "light-dark(#299f51, #35c264)",
  yellow: "light-dark(#a3901a, #e3c93c)",
  orange: "light-dark(#d5641c, #ee8a3c)",
  red: "light-dark(#f12e2f, #f7796d)",
  blue: "light-dark(#268ae0, #5caaf6)",
};
const CLASS = "tab-age-title";
const STYLE_ID = "tab-age-style";

type El = {
  nodeType: number;
  textContent: string | null;
  parentElement: El | null;
  childNodes: ArrayLike<{ nodeType: number }>;
  classList: { add(name: string): void; remove(name: string): void; contains(name: string): boolean };
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  style: { setProperty(name: string, value: string): void };
};
type TextNode = { nodeType: number; parentElement: El | null };
type Mutation = { type: string; target: El; addedNodes: ArrayLike<El> };

declare const document: {
  head: { appendChild(node: unknown): void } | null;
  documentElement: El;
  getElementById(id: string): { remove(): void } | null;
  createElement(tag: "style"): { id: string; textContent: string };
  createTreeWalker(root: El, whatToShow: number): { nextNode(): TextNode | null };
};
declare const MutationObserver: new (cb: (records: Mutation[]) => void) => {
  observe(target: El, options: unknown): void;
  disconnect(): void;
};
declare const getComputedStyle: (el: El) => {
  fontSize: string;
  lineHeight: string;
  whiteSpace: string;
  webkitLineClamp: string;
  borderRadius: string;
};

const CSS = `
.${CLASS} { font-size: 0 !important; line-height: 0 !important; }
.${CLASS}::after {
  content: attr(data-tab-title);
  font-size: var(--tab-age-fs, 13px);
  line-height: var(--tab-age-lh, 16px);
  color: inherit; font-weight: inherit; font-family: inherit; white-space: nowrap;
}
${Object.entries(EDGE)
  .map(
    ([age, color]) =>
      `[data-tab-age-chip="${age}"] { box-shadow: inset 0 -2px 0 0 ${color}, inset 0 -6px 8px -8px color-mix(in srgb, ${color} 40%, transparent); }`,
  )
  .join("\n")}
`;

function markChip(label: El, age: string | null) {
  let el = label.parentElement;
  if (!el || el.getAttribute("data-status-bucket") === null) return;
  for (let i = 0; i < 6 && el; i++, el = el.parentElement) {
    if (getComputedStyle(el).borderRadius === "0px") continue;
    if (age) el.setAttribute("data-tab-age-chip", age);
    else el.removeAttribute("data-tab-age-chip");
    return;
  }
}

function enhance(el: El) {
  const kids = el.childNodes;
  for (let i = 0; i < kids.length; i++) if (kids[i].nodeType === 1) return;
  const text = el.textContent ?? "";
  const match = text.length <= 120 ? PREFIX.exec(text) : null;
  if (!match) {
    if (!el.classList.contains(CLASS)) return;
    el.classList.remove(CLASS);
    el.removeAttribute("data-tab-title");
    markChip(el, null);
    return;
  }
  const cs = getComputedStyle(el);
  if (cs.whiteSpace !== "nowrap" && cs.webkitLineClamp !== "1") return;
  if (!el.classList.contains(CLASS)) {
    el.style.setProperty("--tab-age-fs", cs.fontSize);
    el.style.setProperty("--tab-age-lh", cs.lineHeight === "0px" ? cs.fontSize : cs.lineHeight);
    el.classList.add(CLASS);
  }
  const title = text.slice(match[0].length);
  if (el.getAttribute("data-tab-title") !== title) el.setAttribute("data-tab-title", title);
  markChip(el, MARK[match[1]] ?? "green");
}

function walk(root: El) {
  const walker = document.createTreeWalker(root, 4);
  const seen = new Set<El>();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (PREFIX.test(el.textContent ?? "")) enhance(el);
  }
}

function onMutations(records: Mutation[]) {
  for (const record of records) {
    if (record.type === "attributes") {
      enhance(record.target);
    } else if (record.type === "characterData") {
      if (record.target.parentElement) enhance(record.target.parentElement);
    } else {
      const added = record.addedNodes;
      for (let i = 0; i < added.length; i++) {
        const node = added[i];
        if (node.nodeType === 1) walk(node);
        else if (node.nodeType === 3 && node.parentElement) enhance(node.parentElement);
      }
    }
  }
}

type PipsInstance = { stop: () => void; timer?: NodeJS.Timeout };
const GLOBAL_KEY = "__tabAgePips";
const GRACE_MS = 60_000;

function start(): () => void {
  document.getElementById(STYLE_ID)?.remove();
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head?.appendChild(style);
  walk(document.documentElement);
  const observer = new MutationObserver(onMutations);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => {
    observer.disconnect();
    document.getElementById(STYLE_ID)?.remove();
  };
}

export function installTabPips(): () => void {
  if (typeof document === "undefined" || !document.head) return () => {};
  const g = globalThis as unknown as Record<string, PipsInstance | undefined>;
  const prev = g[GLOBAL_KEY];
  if (prev) {
    clearTimeout(prev.timer);
    prev.stop();
  }
  const instance: PipsInstance = { stop: start() };
  g[GLOBAL_KEY] = instance;
  return () => {
    if (g[GLOBAL_KEY] !== instance) return;
    clearTimeout(instance.timer);
    // Keep styling through brief daemon reconnects, which dispose and reload the plugin.
    instance.timer = setTimeout(() => {
      if (g[GLOBAL_KEY] !== instance) return;
      instance.stop();
      delete g[GLOBAL_KEY];
    }, GRACE_MS);
  };
}
