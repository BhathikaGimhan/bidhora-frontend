import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    // Safely access localStorage
    let storedTheme: string | null = null;
    try {
      storedTheme = localStorage.getItem("theme");
    } catch (e) {
      console.warn("localStorage is not available:", e);
    }

    // Check system preference if no stored theme
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme ? storedTheme === "dark" : prefersDark;

    setIsDark(initialTheme);
    document.documentElement.classList.toggle("light", !initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    document.documentElement.classList.toggle("light", !newTheme);
    document.documentElement.classList.toggle("dark", newTheme);

    // Safely set localStorage
    try {
      localStorage.setItem("theme", newTheme ? "dark" : "light");
    } catch (e) {
      console.warn("Could not set localStorage:", e);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full hover:bg-brand-primary/10 transition-all duration-300 hover:scale-110"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-brand-primary rotate-0 scale-100 transition-transform duration-300" />
      ) : (
        <Moon className="h-5 w-5 text-brand-primary rotate-0 scale-100 transition-transform duration-300" />
      )}
    </Button>
  );
};

export default ThemeToggle;