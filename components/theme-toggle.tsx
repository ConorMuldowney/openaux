"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function applyTheme(nextTheme: Theme) {
  document.documentElement.classList.toggle("dark", nextTheme === "dark");
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setReady(true);
  }, []);

  function onToggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onToggleTheme}
      aria-label="Toggle theme"
      title={ready ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
      className="inline-flex items-center gap-2"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span>{theme === "dark" ? "Light" : "Dark"} mode</span>
    </Button>
  );
}
