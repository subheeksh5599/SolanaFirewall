import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "x402 Firewall — Live Demo" },
      { name: "description", content: "Interact with the x402 Payment Firewall on Solana devnet." },
    ],
  }),
  component: lazyRouteComponent(() => import("../components/AppPage")),
});
