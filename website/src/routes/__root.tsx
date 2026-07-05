import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import "../styles.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: "x402 Firewall — On-Chain Payment Security for Solana AI Agents" },
      { name: "description", content: "Protect autonomous AI agent payments on Solana. Enforce spending limits, block unauthorized recipients, and prevent fund draining with on-chain policy enforcement." },
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600&display=swap" },
    ],
  }),
  component: Root,
});

function Root() {
  return (
    <>
      <HeadContent />
      <Outlet />
    </>
  );
}
