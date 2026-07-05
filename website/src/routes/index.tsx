import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useInView as useInViewFM } from "framer-motion";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { Stats } from "../components/Stats";
import { MadForDev } from "../components/MadForDev";
import { PillTags } from "../components/PillTags";
import { Pricing } from "../components/Pricing";
import { Updates } from "../components/Updates";
import { Footer } from "../components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "x402 Firewall — On-Chain Payment Security for Solana AI Agents" },
      { name: "description", content: "AI-powered on-chain payment firewall for Solana. Enforce spending policies, protect agent wallets, and prevent unauthorized transfers." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative w-full bg-black overflow-hidden">
      <Hero />
      <Features />
      <Stats />
      <MadForDev />
      <PillTags />
      <Pricing />
      <Updates />
      <Footer />
    </div>
  );
}
