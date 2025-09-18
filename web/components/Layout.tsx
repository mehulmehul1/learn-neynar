"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletStatus } from "@/components/wallet-status";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/create", label: "Create" },
  { href: "/activity", label: "Activity" },
  { href: "/queue", label: "Queue" },
];

export const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", next === "dark");
    setTheme(next);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-title font-semibold">
            Kamo
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium sm:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
              onClick={toggleTheme}
              icon={theme === "light" ? <MoonStar className="size-5" /> : <SunMedium className="size-5" />}
            />
            <div className="hidden sm:block">
              <WalletStatus />
            </div>
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation menu"
                    icon={<Menu className="size-5" />}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {NAV_LINKS.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link href={link.href}>{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem asChild>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex w-full items-center justify-between"
                    >
                      Toggle theme
                      {theme === "light" ? <MoonStar className="size-4" /> : <SunMedium className="size-4" />}
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
};
