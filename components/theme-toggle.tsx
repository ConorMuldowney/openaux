"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  function onToggleTheme() {
    const activeTheme = theme === "system" ? resolvedTheme : theme;
    setTheme(activeTheme === "dark" ? "light" : "dark");
  }

  if (!mounted || !theme || !resolvedTheme) {
    return (
      <Button type="button" variant="outline" size="icon" disabled aria-label="Toggle theme">
        <Sun className="size-4" />
        <span className="sr-only">Theme toggle</span>
      </Button>
    );
  }

  const activeTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onToggleTheme}
      aria-label={`Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`}
    >
      {activeTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">Theme toggle</span>
    </Button>
  );
}
