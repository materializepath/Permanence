"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import type React from "react";

type SacredTone = "default" | "primary" | "danger" | "ghost";

export function SacredRoot({ children }: { children: React.ReactNode }) {
  return <div className="sacred-root">{children}</div>;
}

export function SacredWindow({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="sacred-window">
      <header className="sacred-window__header">
        <h1>{title}</h1>
        {actions ? <div className="sacred-window__actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function SacredPanel({
  title,
  kicker,
  info,
  actions,
  children,
  className = "",
}: {
  title?: string;
  kicker?: string;
  info?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`sacred-panel ${className}`.trim()}>
      {title || kicker || actions ? (
        <header className="sacred-panel__header">
          <div>
            {kicker ? <p className="sacred-kicker">{kicker}</p> : null}
            {title && info ? (
              <SacredHeaderPopover text={info}>
                <h2>{title}</h2>
              </SacredHeaderPopover>
            ) : null}
            {title && !info ? <h2>{title}</h2> : null}
          </div>
          {actions ? <div className="sacred-panel__actions">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function SacredButton({
  children,
  tone = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: SacredTone;
}) {
  return (
    <button
      className={`sacred-button sacred-button--${tone} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function SacredActionButton({
  hotkey,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  hotkey: string;
}) {
  return (
    <SacredButton className="sacred-action-button" {...props}>
      <span className="sacred-action-button__hotkey">{hotkey}</span>
      <span>{children}</span>
    </SacredButton>
  );
}

export function SacredBadge({ children }: { children: React.ReactNode }) {
  return <span className="sacred-badge">{children}</span>;
}

export function SacredField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="sacred-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function SacredEmpty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sacred-empty">
      <p>{title}</p>
      <small>{children}</small>
    </div>
  );
}

export function SacredStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="sacred-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function SacredAccordion({
  title,
  defaultValue = true,
  children,
}: {
  title: string;
  defaultValue?: boolean;
  children: ReactNode;
}) {
  const [show, setShow] = useState(defaultValue);
  const toggleShow = (): void => {
    setShow((prevShow) => !prevShow);
  };

  return (
    <>
      <div
        aria-expanded={show}
        className="sacred-row"
        onClick={toggleShow}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            if (event.key === " ") event.preventDefault();
            toggleShow();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className={show ? "sacred-accordion-flex sacred-accordion-active" : "sacred-accordion-flex"}>
          <span className="sacred-accordion-icon">{show ? "▾" : "▸"}</span>
          <span className="sacred-accordion-content">{title}</span>
        </div>
      </div>
      {show && (
        <div className="sacred-row" style={{ paddingLeft: "1ch" }}>
          {children}
        </div>
      )}
    </>
  );
}

export function SacredPopover({
  children,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const popoverStyle: React.CSSProperties = { ...style };

  return (
    <div className="sacred-popover-root" {...rest} style={popoverStyle}>
      {children}
    </div>
  );
}

export function SacredHeaderPopover({
  children,
  text,
}: {
  children: ReactNode;
  text: string;
}) {
  return (
    <span className="sacred-popover-shell">
      <span tabIndex={0} className="sacred-popover-trigger">
        {children}
      </span>
      <SacredPopover role="tooltip">{text}</SacredPopover>
    </span>
  );
}

const SPINNERS: { frames: readonly string[]; interval: number; word: string }[] = [
  { frames: ["⠋⠋⠋⠋", "⠙⠙⠙⠙", "⠹⠹⠹⠹", "⠸⠸⠸⠸", "⠼⠼⠼⠼", "⠴⠴⠴⠴", "⠦⠦⠦⠦", "⠧⠧⠧⠧", "⠇⠇⠇⠇", "⠏⠏⠏⠏"], interval: 80, word: "Thinking" },
  { frames: ["⠁⠂⠄⡀", "⠂⠄⡀⢀", "⠄⡀⢀⠠", "⡀⢀⠠⠐", "⢀⠠⠐⠈", "⠠⠐⠈⠁", "⠐⠈⠁⠂", "⠈⠁⠂⠄"], interval: 100, word: "Reasoning" },
  { frames: ["⡀⠀⠀⠀", "⡄⠀⠀⠀", "⡆⠀⠀⠀", "⡇⠀⠀⠀", "⣇⠀⠀⠀", "⣧⠀⠀⠀", "⣷⠀⠀⠀", "⣿⠀⠀⠀", "⣿⡀⠀⠀", "⣿⡄⠀⠀", "⣿⡆⠀⠀", "⣿⡇⠀⠀", "⣿⣇⠀⠀", "⣿⣧⠀⠀", "⣿⣷⠀⠀", "⣿⣿⠀⠀"], interval: 60, word: "Synthesizing" },
  { frames: ["⠀⠀⠀⠀", "⠂⠂⠂⠂", "⠌⠌⠌⠌", "⡑⡑⡑⡑", "⢕⢕⢕⢕", "⢝⢝⢝⢝", "⣫⣫⣫⣫", "⣟⣟⣟⣟", "⣿⣿⣿⣿", "⣟⣟⣟⣟", "⣫⣫⣫⣫", "⢝⢝⢝⢝", "⢕⢕⢕⢕", "⡑⡑⡑⡑", "⠌⠌⠌⠌", "⠂⠂⠂⠂"], interval: 100, word: "Processing" },
  { frames: ["⠉⠉⠀⠀", "⠈⠉⠁⠀", "⠀⠉⠉⠀", "⠀⠈⠉⠁", "⠀⠀⠉⠉", "⠀⠀⠈⠙", "⠀⠀⠀⠹", "⠀⠀⠀⢸", "⠀⠀⠀⣰", "⠀⠀⢀⣠", "⠀⠀⣀⣀", "⠀⢀⣀⡀"], interval: 80, word: "Evaluating" },
];

const DOTS = [".", "..", "..."];

export function getRandomSacredLoaderIndex() {
  return Math.floor(Math.random() * SPINNERS.length);
}

export function SacredOneLineLoader({ index = 0 }: { index?: number }) {
  const [frame, setFrame] = useState(0);
  const [dotPhase, setDotPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const spinner = SPINNERS[index] ?? SPINNERS[0];

  useEffect(() => {
    const startedAt = performance.now();
    const interval = window.setInterval(() => {
      const nextElapsed = performance.now() - startedAt;
      setElapsed(nextElapsed);
      setFrame((current) => (current + 1) % spinner.frames.length);
      setDotPhase((current) => (current + 1) % DOTS.length);
    }, spinner.interval);

    return () => window.clearInterval(interval);
  }, [spinner]);

  return (
    <span className="sacred-one-line-loader" aria-live="polite">
      <span>
        {spinner.frames[frame]} {spinner.word}
      </span>
      <span className="sacred-one-line-loader__dots">{DOTS[dotPhase]}</span>
      <span>({formatElapsed(elapsed)})</span>
    </span>
  );
}

export function SacredMessageLog({
  children,
  empty,
}: {
  children: ReactNode;
  empty?: ReactNode;
}) {
  const hasChildren = Children.count(children) > 0;
  return <div className="sacred-message-log">{hasChildren ? children : empty}</div>;
}

export function SacredMessage({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="sacred-message">
      <div className="sacred-message-left">
        <figure className="sacred-message-triangle" />
      </div>
      <div className="sacred-message-right">
        <div className="sacred-message-bubble">
          <small>{label}</small>
          <p>{children}</p>
        </div>
      </div>
    </div>
  );
}

export function SacredMessageViewer({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="sacred-message-viewer">
      <div className="sacred-message-viewer-left">
        <div className="sacred-message-viewer-bubble">
          <small>{label}</small>
          <p>{children}</p>
        </div>
      </div>
      <div className="sacred-message-viewer-right">
        <figure className="sacred-message-viewer-triangle" />
      </div>
    </div>
  );
}

function formatElapsed(ms: number) {
  if (ms < 1000) {
    return `${Math.floor(ms)}ms`;
  }

  return `${(ms / 1000).toFixed(1)}s`;
}
