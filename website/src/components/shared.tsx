import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export function ToolIcon({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`size-9 relative bg-white/10 rounded-lg flex items-center justify-center ${className ?? ""}`} style={style}>
      <img src={src} alt="" width={20} height={20} />
    </div>
  );
}

export function StaggeredWords({ text, baseDelay = 0, step = 90, active = true, groupSize = 1 }: { text: string; baseDelay?: number; step?: number; active?: boolean; groupSize?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => {
        const group = Math.floor(i / groupSize);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: active ? undefined : 0,
              animation: active ? "rise-up 0.9s ease-out forwards" : undefined,
              animationDelay: active ? `${baseDelay + group * step}ms` : undefined,
            }}
          >
            {w}{i < words.length - 1 ? "\u00A0" : ""}
          </span>
        );
      })}
    </>
  );
}

export function useInView<T extends HTMLElement>(rootMargin = "0px 0px -15% 0px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); obs.disconnect(); }
    }, { rootMargin });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [rootMargin, seen]);
  return [ref, seen] as const;
}

export function WordsReveal({
  text,
  className,
  as = "span",
  step = 0.06,
  delay = 0,
  duration = 0.7,
  active,
}: {
  text: string;
  className?: string;
  as?: "span" | "h2" | "h3" | "p";
  step?: number;
  delay?: number;
  duration?: number;
  active?: boolean;
}) {
  const words = text.split(" ");
  const MotionTag = motion[as] as typeof motion.span;
  const triggerProps =
    active === undefined
      ? { whileInView: "visible" as const, viewport: { once: true, margin: "-80px" } }
      : { animate: active ? ("visible" as const) : ("hidden" as const) };
  return (
    <MotionTag
      className={className}
      initial="hidden"
      {...triggerProps}
      transition={{ staggerChildren: step, delayChildren: delay }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          style={{ display: "inline-block" }}
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration, ease: "easeOut" }}
        >
          {w}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </MotionTag>
  );
}

export function CountUp({ end, duration = 1500, active, format = (n: number) => n.toLocaleString("en-US") }: { end: number; duration?: number; active: boolean; format?: (n: number) => string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(end * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, end, duration]);
  return <>{format(val)}</>;
}

export function CountUpInView({ end, duration = 1500, delay = 0, format, active }: { end: number; duration?: number; delay?: number; format?: (n: number) => string; active?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [start, setStart] = useState(false);
  useEffect(() => {
    if (active === undefined) return;
    if (!active) return;
    const t = setTimeout(() => setStart(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);
  return <span ref={ref}><CountUp end={end} duration={duration} active={start} format={format} /></span>;
}

export function CountNumber({ to, duration = 1.5, start }: { to: number; duration?: number; start: boolean }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    if (!start) return;
    const controls = animate(mv, to, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [start, to, duration, mv]);
  return <motion.span>{rounded}</motion.span>;
}

export function TypingInput({ placeholder, startDelay = 0, speed = 70 }: { placeholder: string; startDelay?: number; speed?: number }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let i = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = setTimeout(() => {
      const tick = () => {
        if (cancelled) return;
        i += 1;
        setShown(placeholder.slice(0, i));
        if (i < placeholder.length) {
          timer = setTimeout(tick, speed);
        } else {
          setDone(true);
        }
      };
      tick();
    }, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(start);
      if (timer) clearTimeout(timer);
    };
  }, [placeholder, startDelay, speed]);
  return (
    <input
      type="text"
      placeholder={done ? placeholder : shown}
      className="flex-1 min-w-0 bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-400"
    />
  );
}

export function Typewriter({ text, className, speed = 20, delay = 0 }: { text: string; className?: string; speed?: number; delay?: number }) {
  const ref = useRef<HTMLPreElement>(null);
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    let raf = 0;
    const start = setTimeout(() => {
      const tick = () => {
        i += 1;
        setShown(text.slice(0, i));
        if (i < text.length) raf = window.setTimeout(tick, speed) as unknown as number;
      };
      tick();
    }, delay * 1000);
    return () => {
      clearTimeout(start);
      clearTimeout(raf);
    };
  }, [text, speed, delay]);
  return (
    <pre ref={ref} className={className}>
      {shown}
      <span className="inline-block w-[0.5ch] -mb-0.5 bg-white/60 animate-pulse" style={{ height: "1em" }} />
    </pre>
  );
}

export function Pill({ label, icon, bg, text, iconBg, invertIcon = false }: { label: string; icon: string; bg: string; text: string; iconBg: string; invertIcon?: boolean }) {
  return (
    <div
      style={{ backgroundColor: bg }}
      className={`h-20 w-full grow flex items-center gap-4 px-8 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform min-w-0 ${text}`}
    >
      <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <img src={icon} alt="" width={20} height={20} style={invertIcon ? { filter: "brightness(0)" } : undefined} />
      </div>
      <span className="text-2xl font-medium truncate">{label}</span>
    </div>
  );
}

export function PillReveal({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      className="grow flex"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
