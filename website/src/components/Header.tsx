import { useState } from "react";
import { icons, assets } from "./assets";

const navItems = [
  { label: "Product", active: true },
  { label: "Docs", active: false },
  { label: "Pricing", active: false },
  { label: "GitHub", active: false },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="flex items-center px-[20px] pt-6">
        <a href="/" className="shrink-0 anim-rise" style={{ animationDelay: "480ms" }}>
          <img src={icons.logo} alt="x402 Firewall" width={48} height={48} />
        </a>
        <nav className="hidden md:flex items-center gap-[30px] ml-[80px]">
          {navItems.map((item, i) => (
            <a
              key={item.label}
              href="#"
              className={`text-[15px] text-neutral-100 ${item.active ? "opacity-100" : "opacity-50"} hover:opacity-100 transition-opacity anim-rise`}
              style={{ animationDelay: `${600 + i * 60}ms` }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden md:block anim-pop" style={{ animationDelay: "900ms" }}>
          <button className="bg-white text-black rounded-lg py-[11px] px-[20px] text-[15px] font-medium hover:bg-neutral-200 transition-colors">
            Launch App
          </button>
        </div>
        <button
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="ml-auto md:hidden flex flex-col gap-1.5 p-2 anim-pop"
          style={{ animationDelay: "600ms" }}
        >
          <span className="block w-6 h-0.5 bg-neutral-100" />
          <span className="block w-6 h-0.5 bg-neutral-100" />
          <span className="block w-6 h-0.5 bg-neutral-100" />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[100] bg-black md:hidden flex flex-col p-6">
          <div className="flex items-center justify-between">
            <img src={icons.logo} alt="x402 Firewall" width={48} height={48} />
            <button
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="p-2 text-neutral-100 text-3xl leading-none"
            >
              ×
            </button>
          </div>
          <nav className="flex flex-col gap-6 mt-12">
            {navItems.map((item) => (
              <a
                key={item.label}
                href="#"
                onClick={() => setMenuOpen(false)}
                className="text-3xl text-neutral-100 font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <button className="mt-auto bg-white text-black rounded-lg py-4 text-base font-medium">
            Launch App
          </button>
        </div>
      )}
    </>
  );
}
