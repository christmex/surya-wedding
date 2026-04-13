"use client";

import {
  useState,
  useRef,
  useEffect,
} from "react";
import { supabase, type Wish } from "@/app/lib/supabase";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  type Variants,
} from "framer-motion";

/* ── constants ────────────────────────────────────────────── */
const WEDDING_DATE = new Date("2026-06-14T10:00:00");

// Deterministic bokeh dots (no Math.random — avoids hydration mismatch)
const BOKEH = [
  { x: 12,  y: 18,  s: 3, d: 14, dl: 0   },
  { x: 28,  y: 62,  s: 2, d: 10, dl: 2.5 },
  { x: 53,  y: 38,  s: 4, d: 16, dl: 5   },
  { x: 74,  y: 12,  s: 2, d: 12, dl: 1   },
  { x: 88,  y: 72,  s: 3, d: 15, dl: 7.5 },
  { x: 42,  y: 88,  s: 2, d: 11, dl: 3   },
  { x: 19,  y: 52,  s: 3, d: 18, dl: 6   },
  { x: 65,  y: 55,  s: 2, d: 9,  dl: 4   },
  { x: 35,  y: 25,  s: 2, d: 13, dl: 8   },
  { x: 80,  y: 40,  s: 3, d: 11, dl: 1.5 },
];

/* ── animation variants ───────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 44 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const stagger = (staggerChildren = 0.12, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

const lineReveal: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 1.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

/* ── hooks ────────────────────────────────────────────────── */
function useCountdown() {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = WEDDING_DATE.getTime() - Date.now();
      if (diff <= 0) return;
      setT({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/* ── sub-components ───────────────────────────────────────── */

/** Fixed ambient background — floating amber bokeh orbs */
function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {/* Large slow-moving gradient blobs */}
      {[
        { left: "15%",  top: "25%",  size: 700 },
        { left: "72%",  top: "55%",  size: 600 },
        { left: "45%",  top: "80%",  size: 500 },
      ].map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: blob.left,
            top: blob.top,
            width: blob.size,
            height: blob.size,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(180,140,55,0.045) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 25, 0],
            scale: [1, 1.15, 0.92, 1],
          }}
          transition={{
            duration: 22 + i * 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 4,
          }}
        />
      ))}

      {/* Small bokeh dots */}
      {BOKEH.map((dot, i) => (
        <motion.div
          key={`b${i}`}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.s,
            height: dot.s,
            background: "rgba(201, 169, 110, 0.18)",
            filter: "blur(1.5px)",
          }}
          animate={{ y: [0, -28, 0], opacity: [0.1, 0.35, 0.1] }}
          transition={{
            duration: dot.d,
            repeat: Infinity,
            ease: "easeInOut",
            delay: dot.dl,
          }}
        />
      ))}
    </div>
  );
}

/** Per-image parallax wrapper */
function ParallaxImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rawY = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);
  const y = useSpring(rawY, { stiffness: 60, damping: 20 });

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y, height: "120%", marginTop: "-10%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          style={{ filter: "sepia(0.35) saturate(0.5) brightness(0.65)" }}
        />
      </motion.div>
    </div>
  );
}

/** Scroll-triggered fade-up wrapper */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: { opacity: 0, y: 44 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Floating animated diamond ornament */
function FloatingDiamond({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const h = size / 2;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.06, 0.96, 1] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <polygon
        points={`${h},0 ${size},${h} ${h},${size} 0,${h}`}
        stroke="currentColor"
        strokeWidth="0.7"
        fill="none"
      />
    </motion.svg>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Copy-to-clipboard button */
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <motion.button
      onClick={copy}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="mt-6 w-full py-3 text-[9px] tracking-[0.3em] uppercase border border-stone-800/60 text-stone-600 hover:border-amber-400/25 hover:text-amber-400/60 transition-colors duration-300 cursor-pointer flex items-center justify-center gap-2"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy Number
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ── main component ───────────────────────────────────────── */
// Deterministic overlay particles (no Math.random to avoid hydration mismatch)
/* ── Gallery items ────────────────────────────────────────── */
const GALLERY_ITEMS = [
  { src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=700&auto=format&fit=crop", label: "First Meet",     w: 220, h: 330, yOffset:  30 },
  { src: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=700&auto=format&fit=crop", label: "Falling In Love", w: 290, h: 210, yOffset: -30 },
  { src: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=700&auto=format&fit=crop", label: "Engagement",     w: 200, h: 390, yOffset:  60 },
  { src: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=700&auto=format&fit=crop", label: "Pre-Wedding",    w: 310, h: 250, yOffset: -50 },
  { src: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=700&auto=format&fit=crop", label: "The Ceremony",   w: 240, h: 370, yOffset:  20 },
  { src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=700&auto=format&fit=crop", label: "Reception",      w: 270, h: 290, yOffset: -20 },
  { src: "https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=700&auto=format&fit=crop", label: "Forever After",  w: 225, h: 345, yOffset:  45 },
];

const OVERLAY_PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const seed = (i * 137.508 + 42) % 1;
  const x = ((i * 47 + 11) % 97) + 1.5;
  const y = ((i * 61 + 7) % 95) + 2.5;
  const size = (i % 3 === 0) ? 1.5 : (i % 3 === 1) ? 2.5 : 1;
  const dur = 6 + (i % 7) * 1.4;
  const delay = (i * 0.4) % 5;
  const drift = (i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 6);
  return { x, y, size, dur, delay, drift, seed };
});

export default function WeddingPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setGuestName(p.get("to") ?? p.get("name") ?? "");
  }, []);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishName, setWishName] = useState("");
  const [wishMessage, setWishMessage] = useState("");
  const [wishSuccess, setWishSuccess] = useState(false);
  const [wishError, setWishError] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [hoveredGallery, setHoveredGallery] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const gallerySectionRef = useRef<HTMLElement>(null);
  const countdown = useCountdown();

  // Scroll-based parallax for hero
  const { scrollY } = useScroll();
  const rawHeroBgY = useTransform(scrollY, [0, 700], [0, 200]);
  const heroBgY = useSpring(rawHeroBgY, { stiffness: 50, damping: 18 });
  const rawHeroTextY = useTransform(scrollY, [0, 700], [0, -80]);
  const heroTextY = useSpring(rawHeroTextY, { stiffness: 50, damping: 18 });

  // Gallery horizontal scroll
  const { scrollYProgress: galleryProgress } = useScroll({
    target: gallerySectionRef,
    offset: ["start start", "end end"],
  });
  const rawGalleryX = useTransform(galleryProgress, [0, 1], ["0vw", "-62vw"]);
  const galleryTrackX = useSpring(rawGalleryX, { stiffness: 55, damping: 22 });
  const galleryLabelOpacity = useTransform(galleryProgress, [0, 0.05], [0, 1]);

  /* lock body scroll during overlay */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "" : "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* load wishes + realtime subscription */
  useEffect(() => {
    // Initial fetch — newest first
    supabase
      .from("wishes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setWishes(data as Wish[]);
      });

    // Realtime: prepend every new INSERT instantly
    const channel = supabase
      .channel("wishes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wishes" },
        (payload) => {
          setWishes((prev) => [payload.new as Wish, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  /* handlers */
  const handleOpen = () => {
    setIsOpen(true);
    if (guestName.trim()) setWishName(guestName.trim());
    audioRef.current?.play().catch((e) => console.warn("Audio play failed:", e));
    setIsPlaying(true);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((e) => console.warn("Audio play failed:", e));
      setIsPlaying(true);
    }
  };

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWishLoading(true);
    setWishError(false);

    const { data: inserted, error } = await supabase
      .from("wishes")
      .insert({ name: wishName.trim(), message: wishMessage.trim() })
      .select()
      .single();

    setWishLoading(false);

    if (error) {
      setWishError(true);
      setTimeout(() => setWishError(false), 4_000);
      return;
    }

    // Immediately prepend so it shows without waiting for realtime
    if (inserted) {
      setWishes((prev) => {
        if (prev.some((w) => w.id === (inserted as Wish).id)) return prev;
        return [inserted as Wish, ...prev];
      });
    }
    setWishName("");
    setWishMessage("");
    setWishSuccess(true);
    setTimeout(() => setWishSuccess(false), 5_000);
  };

  /* ── render ───────────────────────────────────────────────── */
  return (
    <div
      className="bg-[#080808] text-stone-200 min-h-screen"
      style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
    >
      {/* Film grain overlay */}
      <div
        className="fixed inset-0 z-[200] pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Ambient bokeh background */}
      <AmbientBackground />

      <audio ref={audioRef} loop preload="auto">
        <source src="/wedding-music.mp3" type="audio/mpeg" />
      </audio>

      {/* ════════════════════════════════════════════════════
          OPENING OVERLAY
      ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[100] overflow-hidden flex flex-col items-center justify-center"
            style={{ background: "#060606" }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          >
            {/* ── Deep radial glow ── */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 80% 60% at 50% 55%, rgba(180,140,55,0.10) 0%, transparent 60%)" }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* ── Floating particles ── */}
            {OVERLAY_PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  background: i % 4 === 0 ? "rgba(201,169,110,0.55)" : "rgba(255,255,255,0.18)",
                }}
                animate={{
                  y: [-10, -80 - p.drift, -10],
                  x: [0, p.drift * 0.4, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
              />
            ))}

            {/* ── Animated diagonal line grid ── */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              {Array.from({ length: 12 }, (_, i) => (
                <motion.line
                  key={i}
                  x1={`${(i * 9) - 5}%`} y1="0%"
                  x2={`${(i * 9) + 15}%`} y2="100%"
                  stroke="#c9a96e" strokeWidth="0.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2.5, delay: 0.2 + i * 0.07, ease: "easeOut" }}
                />
              ))}
            </svg>

            {/* ── Corner ornaments ── */}
            {(["top-5 left-5", "top-5 right-5 rotate-90", "bottom-5 left-5 -rotate-90", "bottom-5 right-5 rotate-180"] as const).map((cls) => (
              <motion.div key={cls} className={`absolute ${cls} opacity-25`}
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 0.25, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <svg width="32" height="32" viewBox="0 0 32 32" className="text-amber-400" fill="none">
                  <line x1="0" y1="0" x2="16" y2="0" stroke="currentColor" strokeWidth="0.7" />
                  <line x1="0" y1="0" x2="0" y2="16" stroke="currentColor" strokeWidth="0.7" />
                  <circle cx="0" cy="0" r="1.5" fill="currentColor" opacity="0.6" />
                </svg>
              </motion.div>
            ))}

            {/* ── Top / bottom border lines ── */}
            {(["top-5", "bottom-5"] as const).map((pos) => (
              <motion.div key={pos} className={`absolute ${pos} left-5 right-5 flex items-center gap-3 opacity-20`}
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ duration: 1.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-400/60" />
                <FloatingDiamond size={8} className="text-amber-400 shrink-0" />
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-400/60" />
              </motion.div>
            ))}

            {/* ── Main content ── */}
            <motion.div
              className="relative z-10 flex flex-col items-center text-center px-6 space-y-5 max-w-sm w-full"
              variants={stagger(0.16, 0.2)}
              initial="hidden"
              animate="visible"
            >
              {/* Rotating diamond ornament */}
              <motion.div variants={fadeUp}>
                <motion.svg width="64" height="64" viewBox="0 0 72 72" className="text-amber-400/25"
                  animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.04, 0.97, 1] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}>
                  <polygon points="36,2 70,36 36,70 2,36" stroke="currentColor" strokeWidth="0.7" fill="none" />
                  <polygon points="36,12 60,36 36,60 12,36" stroke="currentColor" strokeWidth="0.4" fill="none" />
                  <line x1="36" y1="2" x2="36" y2="70" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
                  <line x1="2" y1="36" x2="70" y2="36" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
                  <circle cx="36" cy="36" r="2.5" fill="currentColor" opacity="0.5" />
                </motion.svg>
              </motion.div>

              <motion.p variants={fadeUp} className="text-[9px] tracking-[0.55em] uppercase text-stone-600 font-medium">
                The Wedding of
              </motion.p>

              {/* Cinematic name reveal */}
              <motion.h1
                variants={stagger(0.25)}
                className="text-stone-100 leading-none"
                style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(3rem, 11vw, 6rem)", fontWeight: 300 }}
              >
                <span className="block overflow-hidden">
                  <motion.span variants={lineReveal} className="block">Ardy Surya</motion.span>
                </span>
                <span className="block overflow-hidden">
                  <motion.span variants={lineReveal} className="block italic" style={{ color: "rgba(201,169,110,0.8)", fontWeight: 300 }}>
                    &amp; Mila Arinda
                  </motion.span>
                </span>
              </motion.h1>

              <motion.div variants={fadeUp} className="flex items-center gap-4">
                <div className="w-10 h-px bg-stone-800" />
                <p className="text-[9px] tracking-[0.45em] uppercase text-stone-600">14 · 06 · 2026</p>
                <div className="w-10 h-px bg-stone-800" />
              </motion.div>

              {/* ── Guest greeting ── */}
              <AnimatePresence>
                {guestName.trim() && (
                  <motion.div
                    key="greeting"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full pt-1 text-center space-y-1"
                  >
                    <p className="text-[8px] tracking-[0.5em] uppercase text-stone-700">Kepada Yth.</p>
                    <p
                      className="text-stone-300"
                      style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.1rem, 4vw, 1.4rem)", fontWeight: 300, letterSpacing: "0.04em" }}
                    >
                      {guestName.trim()}
                    </p>
                    <motion.div
                      className="mx-auto h-px bg-amber-400/25"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{ width: "60%", transformOrigin: "center" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Open button */}
              <motion.button
                variants={fadeUp}
                onClick={handleOpen}
                whileHover={{ scale: 1.04, borderColor: "rgba(245,245,230,0.8)", color: "#f5f5e6" }}
                whileTap={{ scale: 0.97 }}
                className="mt-2 px-10 py-3.5 text-[10px] tracking-[0.35em] uppercase border border-stone-700/60 text-stone-400 transition-colors duration-500 cursor-pointer w-full"
              >
                Open Invitation
              </motion.button>

              <motion.p variants={fadeUp} className="text-[9px] tracking-[0.2em] uppercase text-stone-800">
                ♪ With Love
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════
          FLOATING MUSIC BUTTON
      ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.button
            key="music-btn"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={toggleMusic}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
            className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full border flex items-center justify-center backdrop-blur-md transition-colors duration-300 ${
              isPlaying
                ? "bg-amber-500/10 border-amber-400/30 text-amber-400 music-playing"
                : "bg-[#111]/80 border-stone-700/50 text-stone-500 hover:text-stone-200 hover:border-stone-600"
            }`}
            aria-label={isPlaying ? "Pause music" : "Play music"}
          >
            {isPlaying ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════ */}
      <motion.div
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      >
        {/* ── NAV ──────────────────────────────────────────── */}
        <nav className="fixed top-0 w-full z-40 backdrop-blur-xl bg-[#080808]/85 border-b border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a
              href="#"
              className="text-stone-200"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: "1.35rem",
                fontWeight: 400,
                letterSpacing: "0.05em",
              }}
            >
              AS
              <span className="italic mx-1" style={{ color: "rgba(201, 169, 110, 0.6)", fontWeight: 300 }}>
                &amp;
              </span>
              MA
            </a>
            <div className="hidden md:flex gap-8 text-[10px] tracking-[0.25em] uppercase text-stone-600 font-medium">
              {([["#couple","Couple"],["#schedule","Schedule"],["#gallery","Gallery"],["#gift","Gift"],["#wishes","Wishes"]] as const).map(([href, label]) => (
                <a key={href} href={href} className="hover:text-stone-300 transition-colors duration-300">{label}</a>
              ))}
            </div>
            <a href="#wishes" className="text-[9px] tracking-[0.25em] uppercase border border-stone-800/70 px-4 py-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 hover:border-stone-100 transition-all duration-400">
              Wishes
            </a>
          </div>
        </nav>

        {/* ════════════════════════════════════════════════════
            HERO — parallax background + counter-parallax text
        ════════════════════════════════════════════════════ */}
        <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
          {/* Parallax background image */}
          <motion.div
            className="absolute inset-0 z-0"
            style={{ y: heroBgY, scale: 1.18 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              style={{ filter: "sepia(0.5) saturate(0.4) brightness(0.2)" }}
            />
          </motion.div>

          {/* Gradient overlays */}
          <div
            className="absolute inset-0 z-[1]"
            style={{ background: "linear-gradient(to bottom, #080808 0%, rgba(8,8,8,0.15) 35%, rgba(8,8,8,0.15) 65%, #080808 100%)" }}
          />
          <motion.div
            className="absolute inset-0 z-[2] pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(180,140,55,0.06) 0%, transparent 70%)",
            }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Hero text — counter-parallax (moves up slower) */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center px-6 space-y-8 max-w-4xl"
            style={{ y: heroTextY }}
            initial="hidden"
            animate={isOpen ? "visible" : "hidden"}
            variants={stagger(0.2, 0.3)}
          >
            <motion.p variants={fadeUp} className="text-[10px] tracking-[0.5em] uppercase text-stone-500 font-medium">
              Joyfully inviting you to the wedding of
            </motion.p>

            {/* Cinematic title reveal */}
            <motion.h1
              variants={stagger(0.3)}
              className="text-stone-100 leading-none"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: "clamp(4rem, 13vw, 9.5rem)",
                fontWeight: 300,
              }}
            >
              <span className="block overflow-hidden">
                <motion.span variants={lineReveal} className="block">Ardy Surya</motion.span>
              </span>
              <span className="block overflow-hidden mt-1">
                <motion.span variants={lineReveal} className="block">
                  <span className="italic" style={{ color: "rgba(201, 169, 110, 0.6)", fontWeight: 300 }}>&amp; </span>
                  Mila Arinda
                </motion.span>
              </span>
            </motion.h1>

            <motion.div variants={fadeUp} className="flex items-center gap-4">
              <div className="w-12 h-px bg-stone-700" />
              <FloatingDiamond size={14} className="text-amber-400/30" />
              <div className="w-12 h-px bg-stone-700" />
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm text-stone-500">
              <span className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Sunday, June 14, 2026
              </span>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-stone-700" />
              <span className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Grand Ballroom, Jakarta
              </span>
            </motion.div>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: isOpen ? 0.25 : 0 }}
            transition={{ delay: 2 }}
          >
            <motion.div
              className="w-px h-10 bg-stone-600"
              animate={{ scaleY: [1, 0.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <p className="text-[8px] tracking-[0.3em] uppercase text-stone-600">Scroll</p>
          </motion.div>
        </section>

        {/* ── QUOTE ─────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <Reveal className="max-w-2xl mx-auto text-center">
            <FloatingDiamond size={16} className="text-amber-400/20 mx-auto mb-8" />
            <p
              className="text-stone-500 font-light leading-relaxed italic"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                fontWeight: 300,
              }}
            >
              "And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquility with them, and He has put love and mercy between your hearts."
            </p>
            <p className="mt-5 text-[9px] tracking-[0.35em] uppercase text-stone-700">Ar-Rum : 21</p>
          </Reveal>
        </section>

        {/* ── COUNTDOWN ────────────────────────────────────── */}
        <section
          className="py-20 px-6 border-y border-white/[0.04]"
          style={{ background: "linear-gradient(to bottom, #0c0c0c, #080808)" }}
        >
          <Reveal className="max-w-xl mx-auto text-center">
            <p className="text-[10px] tracking-[0.4em] uppercase text-stone-600 font-medium mb-12">
              Counting down to the big day
            </p>
            <motion.div
              className="grid grid-cols-4 gap-3 sm:gap-6"
              variants={stagger(0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {(
                [
                  { value: countdown.days, label: "Days" },
                  { value: countdown.hours, label: "Hours" },
                  { value: countdown.minutes, label: "Mins" },
                  { value: countdown.seconds, label: "Secs" },
                ] as const
              ).map(({ value, label }) => (
                <motion.div key={label} variants={fadeUp} className="flex flex-col items-center gap-3">
                  <div className="relative w-full aspect-square max-w-[76px] flex items-center justify-center border border-stone-800/60 bg-stone-900/20">
                    <span className="absolute top-0 left-0 w-2.5 h-px bg-amber-400/30" />
                    <span className="absolute top-0 left-0 w-px h-2.5 bg-amber-400/30" />
                    <span className="absolute top-0 right-0 w-2.5 h-px bg-amber-400/30" />
                    <span className="absolute top-0 right-0 w-px h-2.5 bg-amber-400/30" />
                    <span className="absolute bottom-0 left-0 w-2.5 h-px bg-amber-400/30" />
                    <span className="absolute bottom-0 left-0 w-px h-2.5 bg-amber-400/30" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-px bg-amber-400/30" />
                    <span className="absolute bottom-0 right-0 w-px h-2.5 bg-amber-400/30" />
                    <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.6rem, 5vw, 2rem)", fontWeight: 300, color: "#f0ece4", lineHeight: 1 }}>
                      {pad(value)}
                    </span>
                  </div>
                  <span className="text-[8px] tracking-[0.25em] uppercase text-stone-700 font-medium">{label}</span>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>
        </section>

        {/* ── COUPLE ───────────────────────────────────────── */}
        <section id="couple" className="py-32 px-6 bg-[#080808]">
          <div className="max-w-5xl mx-auto">
            <Reveal className="text-center mb-24">
              <p className="text-[10px] tracking-[0.5em] uppercase text-stone-600 font-medium mb-4">Two hearts, one destiny</p>
              <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 3.75rem)", fontWeight: 300, color: "#f0ece4" }}>
                The Couple
              </h2>
            </Reveal>

            {/* Bride */}
            <motion.div
              className="flex flex-col md:flex-row items-center gap-12 md:gap-20 mb-28"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger(0.2)}
            >
              <motion.div variants={slideLeft} className="w-60 md:w-72 shrink-0">
                <div className="aspect-[3/4] overflow-hidden border border-stone-800/40" style={{ borderRadius: "50% 50% 50% 50% / 55% 55% 45% 45%" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <motion.img
                    src="https://images.unsplash.com/photo-1594938298603-c8148c4b4e10?q=80&w=800&auto=format&fit=crop"
                    alt="The Bride"
                    className="w-full h-full object-cover"
                    style={{ filter: "sepia(0.2) saturate(0.7) brightness(0.8)" }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
              <motion.div variants={fadeUp} className="text-center md:text-left space-y-5 flex-1">
                <span className="text-[9px] tracking-[0.45em] uppercase text-amber-400/50 font-medium">The Bride</span>
                <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2rem, 4vw, 3.25rem)", fontWeight: 300, color: "#f0ece4", lineHeight: 1.1 }}>
                  Mila Arinda
                </h2>
                <div className="space-y-1 text-sm text-stone-500 font-light">
                  <p className="italic text-stone-700 text-xs">Daughter of:</p>
                  <p>Bapak Ahmad Rahmad &amp; Ibu Siti Nurhasanah</p>
                </div>
                <div className="flex items-center gap-3 pt-2 justify-center md:justify-start">
                  <div className="w-8 h-px bg-stone-800" />
                  <span className="text-[9px] tracking-[0.2em] uppercase text-stone-700">@milaarinda</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Divider */}
            <Reveal className="flex items-center justify-center gap-6 mb-28">
              <div className="flex-1 max-w-[120px] h-px bg-stone-800/60" />
              <div className="relative w-14 h-14 flex items-center justify-center">
                <motion.svg width="56" height="56" viewBox="0 0 56 56" className="text-amber-400/15"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                >
                  <polygon points="28,1 55,28 28,55 1,28" stroke="currentColor" strokeWidth="0.7" fill="none" />
                  <polygon points="28,10 46,28 28,46 10,28" stroke="currentColor" strokeWidth="0.4" fill="none" />
                </motion.svg>
                <span className="absolute italic" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, color: "rgba(201, 169, 110, 0.35)" }}>&amp;</span>
              </div>
              <div className="flex-1 max-w-[120px] h-px bg-stone-800/60" />
            </Reveal>

            {/* Groom */}
            <motion.div
              className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger(0.2)}
            >
              <motion.div variants={slideRight} className="w-60 md:w-72 shrink-0">
                <div className="aspect-[3/4] overflow-hidden border border-stone-800/40" style={{ borderRadius: "50% 50% 50% 50% / 55% 55% 45% 45%" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <motion.img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"
                    alt="The Groom"
                    className="w-full h-full object-cover"
                    style={{ filter: "sepia(0.2) saturate(0.7) brightness(0.8)" }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
              <motion.div variants={fadeUp} className="text-center md:text-right space-y-5 flex-1">
                <span className="text-[9px] tracking-[0.45em] uppercase text-amber-400/50 font-medium">The Groom</span>
                <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2rem, 4vw, 3.25rem)", fontWeight: 300, color: "#f0ece4", lineHeight: 1.1 }}>
                  Ardy Surya
                </h2>
                <div className="space-y-1 text-sm text-stone-500 font-light">
                  <p className="italic text-stone-700 text-xs">Son of:</p>
                  <p>Bapak Hendra Pratama &amp; Ibu Dewi Lestari</p>
                </div>
                <div className="flex items-center gap-3 pt-2 justify-center md:justify-end">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-stone-700">@ardysurya</span>
                  <div className="w-8 h-px bg-stone-800" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── SCHEDULE ─────────────────────────────────────── */}
        <section id="schedule" className="py-32 px-6 border-y border-white/[0.04]" style={{ background: "linear-gradient(to bottom, #0c0c0c, #080808)" }}>
          <div className="max-w-4xl mx-auto">
            <Reveal className="text-center mb-20">
              <p className="text-[10px] tracking-[0.5em] uppercase text-stone-600 font-medium mb-4">We await your presence</p>
              <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 3.75rem)", fontWeight: 300, color: "#f0ece4" }}>
                Event Schedule
              </h2>
            </Reveal>

            <motion.div
              className="grid md:grid-cols-2 gap-5"
              variants={stagger(0.15)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {[
                {
                  icon: (<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
                  label: "Holy Matrimony",
                  day: "Saturday, June 13th, 2026",
                  time: "09:00 WIB",
                  venue: "Masjid Istiqlal, Jakarta Pusat",
                },
                {
                  icon: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
                  label: "Wedding Reception",
                  day: "Sunday, June 14th, 2026",
                  time: "11:00 – 15:00 WIB",
                  venue: "Grand Ballroom, Hotel Mulia, Jakarta",
                },
              ].map((ev) => (
                <motion.div
                  key={ev.label}
                  variants={fadeUp}
                  whileHover={{ borderColor: "rgba(180, 140, 55, 0.15)", backgroundColor: "rgba(255,255,255,0.02)" }}
                  className="relative p-10 border border-stone-800/40 bg-stone-900/10 flex flex-col items-center text-center group transition-colors duration-500"
                >
                  <span className="absolute top-0 left-0 w-5 h-px bg-amber-400/20 group-hover:w-10 transition-all duration-500" />
                  <span className="absolute top-0 left-0 h-5 w-px bg-amber-400/20 group-hover:h-10 transition-all duration-500" />
                  <span className="absolute bottom-0 right-0 w-5 h-px bg-amber-400/20 group-hover:w-10 transition-all duration-500" />
                  <span className="absolute bottom-0 right-0 h-5 w-px bg-amber-400/20 group-hover:h-10 transition-all duration-500" />
                  <div className="w-14 h-14 border border-stone-800/60 flex items-center justify-center mb-7 text-amber-400/40 group-hover:border-amber-400/25 group-hover:text-amber-400/60 transition-all duration-500">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">{ev.icon}</svg>
                  </div>
                  <h3 className="mb-3" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 400, color: "#f0ece4" }}>{ev.label}</h3>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-stone-500 font-medium mb-1">{ev.day}</p>
                  <p className="text-sm text-stone-600 font-light mb-5">{ev.time}</p>
                  <p className="text-sm text-stone-500 font-light leading-relaxed mb-6 max-w-[260px]">{ev.venue}</p>
                  <a href="#" className="text-[9px] tracking-[0.3em] uppercase text-stone-600 border-b border-stone-800/60 pb-0.5 hover:text-amber-400/60 hover:border-amber-400/30 transition-colors">View on Map</a>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── GALLERY ──────────────────────────────────────────── */}

        {/* MOBILE: plain horizontal swipe strip — hidden on md+ */}
        <section id="gallery" className="md:hidden py-20 border-t border-white/[0.04]" style={{ background: "#080808" }}>
          <div className="px-6 mb-8">
            <p className="text-[9px] tracking-[0.5em] uppercase text-stone-700 mb-2">A glimpse into our story</p>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0ece4" }}>Our Moments</h2>
          </div>
          {/* Swipeable strip — no snap, just smooth touch scroll */}
          <div
            className="flex gap-5 pb-8"
            style={{
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              paddingLeft: "24px",
              paddingRight: "24px",
              cursor: "grab",
            } as React.CSSProperties}
          >
            {GALLERY_ITEMS.map((item, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col" style={{ width: "58vw" }}>
                <div className="overflow-hidden" style={{ width: "100%", height: "70vw" }}>
                  <img src={item.src} alt={item.label} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="mt-3">
                  <p className="text-[8px] tracking-[0.4em] uppercase text-stone-700 mb-0.5">0{i + 1}</p>
                  <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", fontWeight: 300, color: "#78716c" }}>{item.label}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[8px] tracking-[0.3em] uppercase text-stone-800 mt-2">Swipe to explore →</p>
        </section>

        {/* DESKTOP: sticky scroll-driven horizontal timeline — hidden on mobile */}
        <section
          id="gallery-desktop"
          ref={gallerySectionRef}
          style={{ height: "280vh", background: "#080808" }}
          className="hidden md:block border-t border-white/[0.04]"
        >
          <div className="sticky top-0 overflow-hidden" style={{ height: "100vh" }}>
            {/* Top bar */}
            <motion.div
              style={{ opacity: galleryLabelOpacity }}
              className="absolute top-0 left-0 right-0 z-10 flex items-end justify-between px-8 pt-10"
            >
              <div>
                <p className="text-[9px] tracking-[0.5em] uppercase text-stone-700 mb-2">A glimpse into our story</p>
                <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.6rem, 2.5vw, 2.4rem)", fontWeight: 300, color: "#f0ece4" }}>
                  Our Moments
                </h2>
              </div>
              <p className="text-[8px] tracking-[0.35em] uppercase text-stone-700 mb-1.5">Scroll to explore →</p>
            </motion.div>

            {/* Horizontal track */}
            <motion.div
              style={{
                x: galleryTrackX,
                position: "absolute",
                top: 0,
                paddingLeft: "12vw",
                paddingRight: "20vw",
                paddingTop: "120px",
                paddingBottom: "100px",
                gap: "48px",
                display: "flex",
                alignItems: "center",
                height: "100%",
              }}
            >
              {GALLERY_ITEMS.map((item, i) => (
                <motion.div
                  key={i}
                  className="flex-shrink-0 flex flex-col cursor-pointer"
                  initial={{ opacity: 0, y: item.yOffset + 40 }}
                  animate={{
                    opacity: hoveredGallery === null ? 1 : hoveredGallery === i ? 1 : 0.35,
                    y: item.yOffset,
                    scale: hoveredGallery === null ? 1 : hoveredGallery === i ? 1.06 : 0.93,
                    filter: hoveredGallery !== null && hoveredGallery !== i ? "blur(1.5px)" : "blur(0px)",
                  }}
                  transition={{
                    opacity: { duration: hoveredGallery !== null ? 0.35 : 1.0, delay: hoveredGallery !== null ? 0 : i * 0.08 },
                    y: { duration: 1.1, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
                    scale: { duration: 0.4, ease: "easeOut" },
                    filter: { duration: 0.4, ease: "easeOut" },
                  }}
                  onHoverStart={() => setHoveredGallery(i)}
                  onHoverEnd={() => setHoveredGallery(null)}
                >
                  <div className="overflow-hidden" style={{ width: item.w, height: item.h, flexShrink: 0 }}>
                    <motion.img
                      src={item.src} alt={item.label}
                      className="w-full h-full object-cover"
                      animate={{ scale: hoveredGallery === i ? 1.08 : 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-4" style={{ width: item.w }}>
                    <p className="text-[8px] tracking-[0.4em] uppercase mb-1" style={{ color: hoveredGallery === i ? "#78716c" : "#44403c" }}>
                      0{i + 1}
                    </p>
                    <p className="leading-none whitespace-nowrap transition-colors duration-300"
                      style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1rem, 1.8vw, 1.4rem)", fontWeight: 300, letterSpacing: "0.02em", color: hoveredGallery === i ? "#a8a29e" : "#44403c" }}>
                      {item.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Progress bar */}
            <div className="absolute bottom-5 left-8 right-8 flex items-center gap-4">
              <motion.div className="h-px bg-stone-800/60 flex-1 origin-left" style={{ scaleX: galleryProgress }} />
              <span className="text-[8px] tracking-[0.3em] uppercase text-stone-800 shrink-0">{GALLERY_ITEMS.length} moments</span>
            </div>
          </div>
        </section>

        {/* ── GIFT ─────────────────────────────────────────── */}
        <section id="gift" className="py-32 px-6 border-t border-white/[0.04]" style={{ background: "linear-gradient(to bottom, #080808, #0c0c0c)" }}>
          <div className="max-w-3xl mx-auto">
            <Reveal className="text-center mb-16">
              <p className="text-[10px] tracking-[0.5em] uppercase text-stone-600 font-medium mb-4">Your generosity means the world</p>
              <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 3.75rem)", fontWeight: 300, color: "#f0ece4" }}>
                Wedding Gift
              </h2>
              <p className="mt-4 text-sm text-stone-600 font-light max-w-md mx-auto leading-relaxed">
                Your presence is the greatest gift of all. If you wish to bless us with a gift, a contribution to our account would be warmly appreciated.
              </p>
            </Reveal>

            <motion.div
              className="grid sm:grid-cols-2 gap-5"
              variants={stagger(0.15)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {[
                { bank: "Bank Central Asia (BCA)", name: "Ardy Surya", number: "1234 5678 90", raw: "1234567890" },
                { bank: "Mandiri", name: "Mila Arinda", number: "0987 6543 21", raw: "0987654321" },
              ].map((acc) => (
                <motion.div
                  key={acc.name}
                  variants={fadeUp}
                  whileHover={{ borderColor: "rgba(180, 140, 55, 0.15)" }}
                  className="relative p-8 border border-stone-800/40 bg-stone-900/15 group transition-colors duration-500"
                >
                  <span className="absolute top-0 left-0 w-5 h-px bg-amber-400/20 group-hover:w-10 transition-all duration-500" />
                  <span className="absolute top-0 left-0 h-5 w-px bg-amber-400/20 group-hover:h-10 transition-all duration-500" />
                  <span className="absolute bottom-0 right-0 w-5 h-px bg-amber-400/20 group-hover:w-10 transition-all duration-500" />
                  <span className="absolute bottom-0 right-0 h-5 w-px bg-amber-400/20 group-hover:h-10 transition-all duration-500" />

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 border border-stone-800/60 flex items-center justify-center text-amber-400/40 shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    </div>
                    <span className="text-[9px] tracking-[0.35em] uppercase text-stone-600 font-medium">Bank Transfer</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] tracking-[0.25em] uppercase text-stone-700 mb-1">Bank</p>
                      <p className="text-sm text-stone-300 font-light">{acc.bank}</p>
                    </div>
                    <div>
                      <p className="text-[9px] tracking-[0.25em] uppercase text-stone-700 mb-1">Account Name</p>
                      <p className="text-sm text-stone-300 font-light">{acc.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] tracking-[0.25em] uppercase text-stone-700 mb-1">Account Number</p>
                      <p className="text-stone-100 tracking-widest" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 400, letterSpacing: "0.12em" }}>
                        {acc.number}
                      </p>
                    </div>
                  </div>
                  <CopyButton value={acc.raw} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── WISHES ───────────────────────────────────────── */}
        <section id="wishes" className="py-32 px-6 border-t border-white/[0.04]" style={{ background: "linear-gradient(to bottom, #0c0c0c, #080808)" }}>
          <div className="max-w-5xl mx-auto">
            <Reveal className="text-center mb-20">
              <p className="text-[10px] tracking-[0.5em] uppercase text-stone-600 font-medium mb-4">Share your love</p>
              <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 3.75rem)", fontWeight: 300, color: "#f0ece4" }}>
                Wishes &amp; Blessings
              </h2>
              <p className="mt-4 text-sm text-stone-600 font-light">Leave a note or well wish for the couple</p>
            </Reveal>

            <motion.div
              className="grid md:grid-cols-2 gap-12 md:gap-16 lg:gap-24"
              variants={stagger(0.2)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {/* Form */}
              <motion.div variants={fadeUp}>
                <h3 className="text-[10px] tracking-[0.35em] uppercase text-stone-600 font-medium mb-8">Leave a Message</h3>
                <AnimatePresence mode="wait">
                  {wishSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-20 text-center space-y-5"
                    >
                      <div className="relative w-14 h-14 flex items-center justify-center border border-amber-400/25">
                        <span className="absolute top-0 left-0 w-3 h-px bg-amber-400/40" />
                        <span className="absolute top-0 left-0 h-3 w-px bg-amber-400/40" />
                        <span className="absolute bottom-0 right-0 w-3 h-px bg-amber-400/40" />
                        <span className="absolute bottom-0 right-0 h-3 w-px bg-amber-400/40" />
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-amber-400/50">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </div>
                      <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.75rem", color: "#f0ece4", fontWeight: 300 }}>Thank You</p>
                      <p className="text-sm text-stone-500 font-light max-w-xs">Your beautiful message has been received with love.</p>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={handleWishSubmit} className="space-y-8" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div>
                        <label className="block text-[9px] tracking-[0.3em] uppercase text-stone-700 mb-3">Your Name</label>
                        <input type="text" required value={wishName} onChange={(e) => setWishName(e.target.value)} placeholder="Enter your name"
                          className="w-full bg-transparent border-b border-stone-800/80 pb-3 text-sm text-stone-300 placeholder-stone-800 outline-none focus:border-amber-400/30 transition-colors duration-300" />
                      </div>
                      <div>
                        <label className="block text-[9px] tracking-[0.3em] uppercase text-stone-700 mb-3">Your Wishes</label>
                        <textarea required rows={4} value={wishMessage} onChange={(e) => setWishMessage(e.target.value)} placeholder="Write your well wishes here..."
                          className="w-full bg-transparent border-b border-stone-800/80 pb-3 text-sm text-stone-300 placeholder-stone-800 outline-none resize-none focus:border-amber-400/30 transition-colors duration-300" />
                      </div>
                      <AnimatePresence>
                        {wishError && (
                          <motion.p
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] tracking-[0.2em] uppercase text-red-400/70 text-center"
                          >
                            Something went wrong. Please try again.
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <motion.button
                        type="submit"
                        disabled={wishLoading}
                        whileHover={wishLoading ? {} : { scale: 1.02 }}
                        whileTap={wishLoading ? {} : { scale: 0.97 }}
                        className="w-full py-4 text-[10px] tracking-[0.35em] uppercase font-medium border border-stone-700/60 text-stone-500 hover:bg-stone-100 hover:text-stone-900 hover:border-stone-100 transition-all duration-500 mt-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {wishLoading ? "Sending..." : "Send Wishes"}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Wishes list */}
              <motion.div variants={fadeUp}>
                <h3 className="text-[10px] tracking-[0.35em] uppercase text-stone-600 font-medium mb-8 flex items-center gap-3">
                  Messages <span className="text-stone-800">({wishes.length})</span>
                </h3>
                <div className="h-[420px] overflow-y-auto pr-3 space-y-7" style={{ scrollbarWidth: "thin", scrollbarColor: "#292524 transparent" }}>
                  {wishes.map((wish, i) => (
                    <motion.div
                      key={wish.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.6, ease: "easeOut" }}
                      className="border-b border-stone-800/30 pb-7 last:border-0"
                    >
                      <div className="flex items-baseline gap-3 mb-2.5">
                        <h4 className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-medium">{wish.name}</h4>
                        <span className="text-[9px] text-stone-700 uppercase tracking-wider">
                          {new Date(wish.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </span>
                      </div>
                      <p className="text-stone-500 font-light italic leading-relaxed" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.05rem" }}>
                        &ldquo;{wish.message}&rdquo;
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── CLOSING ──────────────────────────────────────── */}
        <section className="py-24 px-6 text-center" style={{ background: "linear-gradient(to bottom, #080808, #040404)" }}>
          <Reveal className="max-w-xl mx-auto">
            <FloatingDiamond size={14} className="text-amber-400/20 mx-auto mb-8" />
            <p className="text-sm text-stone-600 font-light leading-relaxed italic mb-8">
              It is an honor and happiness for us if you could bless our union.
              <br />With love, we sincerely thank you.
            </p>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 300, color: "#f0ece4" }}>
              Ardy Surya{" "}
              <span className="italic" style={{ color: "rgba(201, 169, 110, 0.5)", fontWeight: 300 }}>&amp;</span>{" "}
              Mila Arinda
            </h2>
          </Reveal>
        </section>

        {/* ── FOOTER ───────────────────────────────────────── */}
        <footer className="py-10 text-center bg-[#040404] border-t border-white/[0.03]">
          <div className="flex items-center justify-center gap-5 mb-4">
            <div className="w-14 h-px bg-stone-900" />
            <FloatingDiamond size={10} className="text-stone-800" />
            <div className="w-14 h-px bg-stone-900" />
          </div>
          <p className="text-[9px] tracking-[0.35em] uppercase text-stone-800">June 14, 2026 · Jakarta, Indonesia</p>
        </footer>
      </motion.div>
    </div>
  );
}
