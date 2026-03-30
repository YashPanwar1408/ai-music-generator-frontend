"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { DAISYUI_THEMES, type DaisyUITheme } from "~/lib/daisyui-themes";
import { cn } from "~/lib/utils";

function ThemeSwatch({ themeName }: { themeName: DaisyUITheme }) {
  return (
    <span
      data-theme={themeName}
      className="grid shrink-0 grid-cols-2 gap-0.5"
      aria-hidden="true"
    >
      <span className="bg-primary h-2 w-2 rounded-full" />
      <span className="bg-secondary h-2 w-2 rounded-full" />
      <span className="bg-accent h-2 w-2 rounded-full" />
      <span className="bg-neutral h-2 w-2 rounded-full" />
    </span>
  );
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn("btn btn-sm m-1 pointer-events-none opacity-0", className)}
        aria-hidden="true"
      >
        Theme
      </div>
    );
  }

  const currentTheme =
    theme && (DAISYUI_THEMES as readonly string[]).includes(theme)
      ? theme
      : "light";

  return (
    <div className={cn("dropdown dropdown-end", className)}>
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm m-1"
      >
        <span>Theme</span>
        <svg
          width="12px"
          height="12px"
          className="inline-block h-2 w-2 fill-current opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
          aria-hidden="true"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z" />
        </svg>
      </div>

      <ul
        tabIndex={-1}
        className="dropdown-content bg-base-100 rounded-box z-10 mt-1 max-h-80 w-52 overflow-y-auto p-2 shadow-2xl"
      >
        {DAISYUI_THEMES.map((themeName) => (
          <li key={themeName}>
            <button
              type="button"
              className={cn(
                "btn btn-sm btn-block justify-start btn-ghost gap-2",
                themeName === currentTheme && "btn-active"
              )}
              onClick={() => setTheme(themeName)}
            >
              <ThemeSwatch themeName={themeName} />
              <span className="truncate">{themeName}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
