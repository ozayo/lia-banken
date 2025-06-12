import { ThemeSwitcher } from "@/components/theme-switcher";

export function Footer() {
  return (
    <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
      <p>
        Built by{" "}
        <a
          href="https://www.ozayozdemir.com"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          Ozay Ozdemir
        </a>
      </p>
      <ThemeSwitcher />
    </footer>
  );
} 