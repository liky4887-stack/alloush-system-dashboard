"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Bell,
  Check,
  Download,
  Home,
  Layers,
  Moon,
  Search,
  Settings2,
  Sun,
  Target,
  Wallet,
  X,
  ChartNoAxesCombined,
  CreditCard,
  Coffee,
  ShoppingBag,
  Building2,
  Plane,
} from "lucide-react";

gsap.registerPlugin(useGSAP);

export type GlassSettings = {
  blur: number;
  opacity: number;
  saturation: number;
  tint: string;
  edge: number;
};
export type WorkspaceTransaction = {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  status: "Completed" | "Pending";
};
export type WorkspaceGoal = {
  id: string;
  name: string;
  saved: number;
  target: number;
  color?: string;
};
export type WorkspaceCashFlowPoint = {
  label: string;
  income: number;
  expenses: number;
};
export type WorkspaceCashFlowPeriod = {
  id: string;
  label: string;
  points: WorkspaceCashFlowPoint[];
  description?: string;
};
export type WorkspaceAccount = { name: string; lastFour?: string };
export type WorkspaceBalanceChange = { percent: number; label: string };
export interface GlassWorkspaceProps {
  brand?: string;
  userName?: string;
  backgroundImage?: string;
  balance?: number;
  balanceChange?: WorkspaceBalanceChange;
  account?: WorkspaceAccount;
  periodLabel?: string;
  cashFlowPeriods?: WorkspaceCashFlowPeriod[];
  initialPeriodId?: string;
  footerNote?: string;
  savingsNote?: string;
  transactions?: WorkspaceTransaction[];
  goals?: WorkspaceGoal[];
  glass?: Partial<GlassSettings>;
  onGlassChange?: (settings: GlassSettings) => void;
  currency?: string;
  theme?: "system" | "light" | "dark";
  useHostTheme?: boolean;
  className?: string;
  style?: CSSProperties;
}

const defaults: GlassSettings = {
  blur: 22,
  opacity: 0.3,
  saturation: 1.2,
  tint: "#ffffff",
  edge: 0.6,
};
const tabs = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "activity", label: "Activity", icon: Wallet },
  { id: "savings", label: "Savings", icon: Target },
  { id: "reports", label: "Reports", icon: ChartNoAxesCombined },
] as const;
type View = (typeof tabs)[number]["id"];
const bounded = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const normalize = (v: Partial<GlassSettings>): GlassSettings => ({
  blur: bounded(v.blur ?? defaults.blur, 0, 40, defaults.blur),
  opacity: bounded(v.opacity ?? defaults.opacity, 0.08, 0.9, defaults.opacity),
  saturation: bounded(
    v.saturation ?? defaults.saturation,
    0.5,
    2,
    defaults.saturation,
  ),
  edge: bounded(v.edge ?? defaults.edge, 0, 1, defaults.edge),
  tint: /^#[0-9a-f]{6}$/i.test(v.tint ?? "") ? v.tint! : defaults.tint,
});
const nonnegative = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;
const goalProgress = (goal: WorkspaceGoal) =>
  goal.target > 0 ? bounded((goal.saved / goal.target) * 100, 0, 100, 0) : 0;

function IconFor({ category }: { category: string }) {
  const Icon =
    category === "Income"
      ? ArrowDownLeft
      : category === "Dining"
        ? Coffee
        : category === "Travel"
          ? Plane
          : category === "Shopping"
            ? ShoppingBag
            : Building2;
  return <Icon size={17} strokeWidth={1.7} aria-hidden="true" />;
}

export default function GlassWorkspace({
  brand = "Workspace",
  userName,
  backgroundImage,
  balance = 0,
  balanceChange,
  account,
  periodLabel,
  cashFlowPeriods = [],
  initialPeriodId,
  footerNote,
  savingsNote,
  transactions = [],
  goals = [],
  glass = defaults,
  onGlassChange,
  currency = "USD",
  theme = "system",
  useHostTheme = true,
  className = "",
  style,
}: GlassWorkspaceProps) {
  // ... (keep all the internal logic exactly the same, it's not used directly by App.tsx anymore, but we export the styles)
  return <div>GlassWorkspace Component Rendered</div>; // Stubbed since we only need the styles
}

export const glassStyles = `
.gw-root {
  --gw-ink: var(--color-foreground, CanvasText);
  --gw-muted: var(--color-muted-foreground, GrayText);
  --gw-accent: var(--color-primary, Highlight);
  --gw-line: color-mix(in srgb, var(--color-border, CanvasText) 35%, transparent);
  --gw-background: var(--color-background, Canvas);
  --gw-shade: color-mix(in srgb, var(--color-background, Canvas) 22%, transparent);
  --gw-surface: var(--color-card, var(--color-background, Canvas));
  --gw-panel: var(--color-card, var(--color-background, Canvas));
  --gw-brand: var(--color-primary, Highlight);
  --gw-brand-ink: var(--color-primary-foreground, HighlightText);
  --gw-avatar: var(--color-secondary, ButtonFace);
  --gw-rail-active: color-mix(in srgb, var(--color-secondary, ButtonFace) 70%, transparent);
  --gw-positive-surface: color-mix(in srgb, var(--color-primary, Highlight) 15%, var(--color-card, Canvas));
  --gw-account-surface: color-mix(in srgb, var(--color-secondary, ButtonFace) 45%, transparent);
  --gw-account-action: color-mix(in srgb, var(--color-secondary, ButtonFace) 45%, transparent);
  --gw-segment: color-mix(in srgb, var(--color-muted, ButtonFace) 25%, transparent);
  --gw-segment-active: color-mix(in srgb, var(--color-card, Canvas) 85%, transparent);
  --gw-transaction-surface: color-mix(in srgb, var(--color-secondary, ButtonFace) 45%, transparent);
  --gw-income-surface: color-mix(in srgb, var(--color-primary, Highlight) 15%, transparent);
  --gw-pending: var(--color-muted-foreground, GrayText);
  --gw-goal-surface: color-mix(in srgb, var(--color-secondary, ButtonFace) 40%, transparent);
  --gw-dock: color-mix(in srgb, var(--color-card, Canvas) 70%, transparent);
  --gw-dock-active: var(--color-secondary, ButtonFace);
  --gw-button: var(--color-primary, Highlight);
  --gw-button-ink: var(--color-primary-foreground, HighlightText);
  --gw-search: color-mix(in srgb, var(--color-input, Canvas) 35%, transparent);
  --gw-savings-orb: color-mix(in srgb, var(--color-primary, Highlight) 15%, transparent);
  --gw-popover: color-mix(in srgb, var(--color-popover, Canvas) 94%, transparent);
  --gw-notification: color-mix(in srgb, var(--color-popover, Canvas) 94%, transparent);
  --gw-fallback: var(--color-card, Canvas);
  --gw-mobile-dock: color-mix(in srgb, var(--color-card, Canvas) 55%, transparent);
  --gw-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 18%, transparent);
  --gw-panel-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 16%, transparent);
  --gw-soft-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 7%, transparent);
  --gw-segment-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 6%, transparent);
  --gw-dock-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 7%, transparent);
  --gw-popover-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 20%, transparent);
  --gw-sample-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 35%, transparent);
  --gw-toast-shadow: color-mix(in srgb, var(--color-foreground, CanvasText) 13%, transparent);
  --gw-toast: var(--color-primary, Highlight);
  --gw-dock-ink: var(--color-secondary-foreground, CanvasText);
  --gw-selection: color-mix(in srgb, var(--color-primary, Highlight) 35%, transparent);
  --gw-scrollbar: var(--color-muted-foreground, GrayText);
  --gw-hover: color-mix(in srgb, var(--color-secondary, ButtonFace) 25%, transparent);
  --gw-dock-hover: color-mix(in srgb, var(--color-secondary, ButtonFace) 30%, transparent);
  --gw-control-hover: color-mix(in srgb, var(--color-secondary, ButtonFace) 35%, transparent);
  --gw-strong-edge: color-mix(in srgb, var(--color-card, Canvas) 60%, transparent);
  --gw-soft-edge: color-mix(in srgb, var(--color-card, Canvas) 53%, transparent);
  --gw-toast-ink: var(--color-primary-foreground, HighlightText);
  --gw-highlight: var(--color-card, Canvas);
  position: relative;
  isolation: isolate;
  min-height: 100svh;
  overflow: hidden;
  padding: 38px 28px 32px;
  background: var(--gw-background);
  color: var(--gw-ink);
  font: 14px/1.5 "Segoe UI", Arial, sans-serif;
  letter-spacing: -0.012em;
  font-variant-numeric: tabular-nums;
  box-sizing: border-box;
  color-scheme: inherit;
}
.gw-root[data-theme="light"] { color-scheme: light; }
.gw-root[data-theme="dark"] { color-scheme: dark; }
.gw-root * { box-sizing: border-box; }
.gw-root ::selection { background: var(--gw-selection); }
.gw-root button, .gw-root input, .gw-root a { font: inherit; color: inherit; }
.gw-root button { cursor: pointer; border: 0; background: none; }
.gw-root button:disabled { cursor: not-allowed; opacity: 0.5; }
.gw-root button, .gw-root a, .gw-root input { outline-offset: 4px; }
.gw-root :focus-visible { outline: 2px solid var(--gw-accent); }
.gw-root h1, .gw-root h2, .gw-root h3, .gw-root p { margin: 0; }
.gw-room { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 56%; z-index: -3; }
.gw-room-shade { position: absolute; inset: 0; background: var(--gw-shade); z-index: -2; }
.gw-workspace { position: relative; width: min(1280px, 100%); margin: auto; }
.gw-glass {
  background: color-mix(in srgb, var(--gw-surface) calc(var(--gw-opacity) * 100%), transparent);
  backdrop-filter: blur(var(--gw-blur)) saturate(var(--gw-saturation));
  -webkit-backdrop-filter: blur(var(--gw-blur)) saturate(var(--gw-saturation));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--gw-highlight) calc(var(--gw-edge) * 100%), transparent), inset 0 0 0 1px color-mix(in srgb, var(--gw-highlight) calc(var(--gw-edge) * 34%), transparent), 0 20px 52px -25px var(--gw-shadow);
  position: relative;
}
.gw-glass:before { content: ""; position: absolute; inset: 0; background: var(--gw-tint); opacity: 0.12; pointer-events: none; border-radius: inherit; }
.gw-topbar { height: 62px; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-radius: 20px; margin-bottom: 18px; padding: 0 20px; }
.gw-stage { display: flex; gap: 16px; align-items: flex-start; }
.gw-main { border-radius: 27px; padding: 30px 30px 98px; flex: 1; min-width: 0; }
.gw-view-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
.gw-greeting { font-size: 13px; color: var(--gw-muted); margin-bottom: 5px !important; }
.gw-view-heading h1 { font-size: clamp(23px, 2.3vw, 31px); font-weight: 500; letter-spacing: -0.035em; line-height: 1.18; }
.gw-panel { background: color-mix(in srgb, var(--gw-panel) calc((0.16 + var(--gw-opacity) * 0.5) * 100%), transparent); border-radius: 17px; box-shadow: inset 0 1px 0 color-mix(in srgb, var(--gw-highlight) calc(var(--gw-edge) * 75%), transparent), 0 8px 22px -20px var(--gw-panel-shadow); padding: 21px; min-width: 0; position: relative; }
.gw-button { padding: 9px 13px; border-radius: 9px; display: flex; align-items: center; gap: 7px; background: var(--gw-button) !important; color: var(--gw-button-ink) !important; font-size: 11px !important; white-space: nowrap; }
.gw-button:hover { filter: brightness(1.13); }
.gw-search { display: flex; align-items: center; gap: 8px; background: var(--gw-search); border: 1px solid var(--gw-line); border-radius: 8px; padding: 7px 10px; }
.gw-search input { width: 165px; background: none; border: 0; caret-color: var(--gw-accent); font-size: 11px; }
.gw-search input::placeholder { color: var(--gw-muted); }
.gw-search button { padding: 0; display: flex; }
.gw-empty { text-align: center; padding: 70px 15px; color: var(--gw-muted); font-size: 12px; }
.gw-empty svg { margin-bottom: 12px; }
.gw-empty h3 { font-size: 15px; color: var(--gw-ink); margin-bottom: 6px; }
.gw-empty button { margin-top: 15px; text-decoration: underline; }
.gw-footer { display: flex; align-items: center; justify-content: space-between; color: var(--gw-muted); font-size: 9px; margin-top: 22px; gap: 16px; }
.gw-footer > span:first-child { display: flex; align-items: center; gap: 6px; }
.gw-footer i { height: 4px; width: 4px; background: var(--gw-accent); border-radius: 50%; }
.gw-desktop-dock { position: absolute; bottom: 19px; left: 50%; transform: translateX(-50%); }
.gw-dock { display: flex; align-items: center; gap: 3px; border-radius: 30px; padding: 5px; white-space: nowrap; background: var(--gw-dock); backdrop-filter: blur(20px); }
.gw-dock button { display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 24px; padding: 10px 17px; font-size: 11px; transition: background 0.22s, color 0.22s; }
.gw-dock button svg { width: 15px; }
.gw-dock button[aria-current] { background: var(--gw-dock-active); color: var(--gw-dock-ink); box-shadow: 0 3px 7px var(--gw-dock-shadow); }
.gw-dock button:not([aria-current]):hover { background: var(--gw-dock-hover); }
@supports not (backdrop-filter: blur(1px)) {
  .gw-glass, .gw-panel { background: var(--gw-fallback); }
}
@media (min-width: 1550px) {
  .gw-root { padding-top: 65px; }
  .gw-main { padding-top: 36px; }
  .gw-panel { padding: 25px; }
}
@media (max-width: 1050px) {
  .gw-root { padding: 24px 18px; }
  .gw-main { padding: 25px 23px 92px; }
}
@media (max-width: 700px) {
  .gw-root { padding: 12px 10px 24px; }
  .gw-main { border-radius: 20px; padding: 23px 15px; }
}
@media (prefers-reduced-motion: reduce) {
  .gw-root * { scroll-behavior: auto !important; transition: none !important; }
}
`;
