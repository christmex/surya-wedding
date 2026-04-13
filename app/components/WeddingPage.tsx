"use client";

import { useState, useRef, useEffect } from "react";

interface Wish {
  id: string;
  name: string;
  message: string;
  date: string;
}

const SEED_WISHES: Wish[] = [
  {
    id: "1",
    name: "Rizky & Indah",
    message:
      "May your marriage be filled with endless love and laughter. So happy for you both, wishing you all the happiness in the world!",
    date: "April 2026",
  },
  {
    id: "2",
    name: "Budi Santoso",
    message:
      "Congratulations! Wishing you a beautiful journey together as husband and wife. May every day bring you closer together.",
    date: "April 2026",
  },
  {
    id: "3",
    name: "Keluarga Rahmad",
    message:
      "Semoga menjadi keluarga yang sakinah, mawaddah, warahmah. Selamat menempuh hidup baru, bahagia selalu!",
    date: "April 2026",
  },
];

const WEDDING_DATE = new Date("2026-06-14T10:00:00");

/* ── tiny helpers ─────────────────────────────────────────── */
function pad(n: number) {
  return String(n).padStart(2, "0");
}

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

/* ── diamond ornament SVG ─────────────────────────────────── */
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="mt-6 w-full py-3 text-[9px] tracking-[0.3em] uppercase border border-stone-800/60 text-stone-600 hover:border-amber-400/25 hover:text-amber-400/60 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          Copy Number
        </>
      )}
    </button>
  );
}

function Diamond({ size = 20, className = "" }: { size?: number; className?: string }) {
  const h = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <polygon
        points={`${h},0 ${size},${h} ${h},${size} 0,${h}`}
        stroke="currentColor"
        strokeWidth="0.7"
        fill="none"
      />
    </svg>
  );
}

/* ── main component ───────────────────────────────────────── */
export default function WeddingPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [overlayLeaving, setOverlayLeaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishName, setWishName] = useState("");
  const [wishMessage, setWishMessage] = useState("");
  const [wishSuccess, setWishSuccess] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const countdown = useCountdown();

  /* lock scroll on overlay */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "" : "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* load wishes */
  useEffect(() => {
    const stored = localStorage.getItem("surya-wedding-wishes");
    if (stored) {
      try {
        setWishes(JSON.parse(stored));
      } catch {
        setWishes(SEED_WISHES);
      }
    } else {
      setWishes(SEED_WISHES);
    }
  }, []);

  /* scroll reveal */
  useEffect(() => {
    if (!isOpen) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isOpen]);

  /* handlers */
  const handleOpen = () => {
    setOverlayLeaving(true);
    audioRef.current?.play().catch((err) => console.warn("Audio play failed:", err));
    setIsPlaying(true);
  };

  const handleOverlayEnd = () => {
    if (overlayLeaving) setIsOpen(true);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleWishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wish: Wish = {
      id: Date.now().toString(),
      name: wishName.trim(),
      message: wishMessage.trim(),
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
    const updated = [wish, ...wishes];
    setWishes(updated);
    localStorage.setItem("surya-wedding-wishes", JSON.stringify(updated));
    setWishName("");
    setWishMessage("");
    setWishSuccess(true);
    setTimeout(() => setWishSuccess(false), 5_000);
  };

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div
      className="grain bg-[#080808] text-stone-200 min-h-screen"
      style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
    >
      {/* Local audio — served from /public/wedding-music.mp3 */}
      <audio ref={audioRef} loop preload="auto">
        <source src="/wedding-music.mp3" type="audio/mpeg" />
      </audio>

      {/* ══════════════════════════════════════════════════════
          OPENING OVERLAY
      ══════════════════════════════════════════════════════ */}
      {!isOpen && (
        <div
          className={`fixed inset-0 z-[100] bg-[#080808] flex flex-col items-center justify-center transition-opacity duration-1000 ${
            overlayLeaving ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          onTransitionEnd={handleOverlayEnd}
        >
          {/* Radial amber glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(180, 140, 55, 0.08) 0%, transparent 65%)",
            }}
          />

          {/* Top decorative line */}
          <div className="absolute top-6 left-6 right-6 flex items-center gap-3 opacity-25">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-400/50" />
            <Diamond size={10} className="text-amber-400 shrink-0" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-400/50" />
          </div>

          {/* Bottom decorative line */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 opacity-25">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-400/50" />
            <Diamond size={10} className="text-amber-400 shrink-0" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-400/50" />
          </div>

          {/* Corner ornaments */}
          {(
            [
              "top-5 left-5",
              "top-5 right-5 rotate-90",
              "bottom-5 left-5 -rotate-90",
              "bottom-5 right-5 rotate-180",
            ] as const
          ).map((cls) => (
            <div key={cls} className={`absolute ${cls} opacity-20`}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                className="text-amber-400"
                fill="none"
              >
                <line x1="0" y1="0" x2="14" y2="0" stroke="currentColor" strokeWidth="0.6" />
                <line x1="0" y1="0" x2="0" y2="14" stroke="currentColor" strokeWidth="0.6" />
              </svg>
            </div>
          ))}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 space-y-6 max-w-md">
            {/* Large ornamental diamond */}
            <div
              className="overlay-item"
              style={{ "--delay": "0.1s" } as React.CSSProperties}
            >
              <svg
                width="72"
                height="72"
                viewBox="0 0 72 72"
                className="text-amber-400/25"
              >
                <polygon
                  points="36,2 70,36 36,70 2,36"
                  stroke="currentColor"
                  strokeWidth="0.7"
                  fill="none"
                />
                <polygon
                  points="36,12 60,36 36,60 12,36"
                  stroke="currentColor"
                  strokeWidth="0.4"
                  fill="none"
                />
                <line x1="36" y1="2" x2="36" y2="70" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
                <line x1="2" y1="36" x2="70" y2="36" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
                <circle cx="36" cy="36" r="2.5" fill="currentColor" opacity="0.5" />
              </svg>
            </div>

            <p
              className="overlay-item text-[10px] tracking-[0.5em] uppercase text-stone-600 font-medium"
              style={{ "--delay": "0.3s" } as React.CSSProperties}
            >
              The Wedding of
            </p>

            <h1
              className="overlay-item text-stone-100 leading-none"
              style={
                {
                  "--delay": "0.5s",
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: "clamp(3.5rem, 12vw, 7rem)",
                  fontWeight: 300,
                } as React.CSSProperties
              }
            >
              Ardy Surya
              <span
                className="block mt-1"
                style={{ color: "rgba(201, 169, 110, 0.75)", fontStyle: "italic" }}
              >
                &amp; Mila Arinda
              </span>
            </h1>

            <div
              className="overlay-item flex items-center gap-5"
              style={{ "--delay": "0.7s" } as React.CSSProperties}
            >
              <div className="w-14 h-px bg-stone-800" />
              <p className="text-[10px] tracking-[0.4em] uppercase text-stone-600">
                14 · 06 · 2026
              </p>
              <div className="w-14 h-px bg-stone-800" />
            </div>

            <button
              onClick={handleOpen}
              className="overlay-item mt-4 px-10 py-3.5 text-[10px] tracking-[0.35em] uppercase border border-stone-700/60 text-stone-400 hover:bg-stone-100 hover:text-stone-900 hover:border-stone-100 transition-all duration-500 cursor-pointer"
              style={{ "--delay": "0.9s" } as React.CSSProperties}
            >
              Open Invitation
            </button>

            <p
              className="overlay-item text-[9px] tracking-[0.2em] uppercase text-stone-700"
              style={{ "--delay": "1.1s" } as React.CSSProperties}
            >
              ♪ With music
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          FLOATING MUSIC BUTTON
      ══════════════════════════════════════════════════════ */}
      {isOpen && (
        <button
          onClick={toggleMusic}
          className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 backdrop-blur-md ${
            isPlaying
              ? "bg-amber-500/10 border-amber-400/30 text-amber-400 music-playing"
              : "bg-[#111]/80 border-stone-700/50 text-stone-500 hover:text-stone-200 hover:border-stone-600"
          }`}
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          ) : (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
          )}
        </button>
      )}

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════ */}
      <div
        className={`transition-opacity duration-1000 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
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
              <span
                className="italic mx-1"
                style={{ color: "rgba(201, 169, 110, 0.6)", fontWeight: 300 }}
              >
                &amp;
              </span>
              MA
            </a>

            <div className="hidden md:flex gap-8 text-[10px] tracking-[0.25em] uppercase text-stone-600 font-medium">
              {(
                [
                  ["#couple", "Couple"],
                  ["#schedule", "Schedule"],
                  ["#gallery", "Gallery"],
                  ["#gift", "Gift"],
                  ["#wishes", "Wishes"],
                ] as const
              ).map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="hover:text-stone-300 transition-colors duration-300"
                >
                  {label}
                </a>
              ))}
            </div>

            <a
              href="#wishes"
              className="text-[9px] tracking-[0.25em] uppercase border border-stone-800/70 px-4 py-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 hover:border-stone-100 transition-all duration-400"
            >
              Wishes
            </a>
          </div>
        </nav>

        {/* ── HERO ─────────────────────────────────────────── */}
        <section
          id="hero"
          className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16"
        >
          {/* Background */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              style={{
                filter: "sepia(0.5) saturate(0.4) brightness(0.2)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, #080808 0%, rgba(8,8,8,0.3) 30%, rgba(8,8,8,0.3) 70%, #080808 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(180,140,55,0.05) 0%, transparent 70%)",
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 space-y-8 max-w-4xl reveal">
            <p className="text-[10px] tracking-[0.5em] uppercase text-stone-500 font-medium">
              Joyfully inviting you to the wedding of
            </p>

            <h1
              className="text-stone-100 leading-none"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: "clamp(4rem, 13vw, 9.5rem)",
                fontWeight: 300,
              }}
            >
              Ardy Surya
              <span className="block mt-1">
                <span
                  className="italic"
                  style={{ color: "rgba(201, 169, 110, 0.6)", fontWeight: 300 }}
                >
                  &amp;{" "}
                </span>
                Mila Arinda
              </span>
            </h1>

            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-stone-700" />
              <Diamond size={14} className="text-amber-400/30" />
              <div className="w-12 h-px bg-stone-700" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm text-stone-500">
              <span className="flex items-center gap-2">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Sunday, June 14, 2026
              </span>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-stone-700" />
              <span className="flex items-center gap-2">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Grand Ballroom, Jakarta
              </span>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-25">
            <div className="w-px h-10 bg-stone-600 animate-pulse" />
            <p className="text-[8px] tracking-[0.3em] uppercase text-stone-600">
              Scroll
            </p>
          </div>
        </section>

        {/* ── QUOTE ────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center reveal">
            <Diamond size={16} className="text-amber-400/20 mx-auto mb-8" />
            <p
              className="text-stone-500 font-light leading-relaxed italic"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                fontWeight: 300,
              }}
            >
              "And among His signs is that He created for you mates from among
              yourselves, that you may dwell in tranquility with them, and He has
              put love and mercy between your hearts."
            </p>
            <p className="mt-5 text-[9px] tracking-[0.35em] uppercase text-stone-700">
              Ar-Rum : 21
            </p>
          </div>
        </section>

        {/* ── COUNTDOWN ────────────────────────────────────── */}
        <section
          className="py-20 px-6 border-y border-white/[0.04]"
          style={{
            background: "linear-gradient(to bottom, #0c0c0c, #080808)",
          }}
        >
          <div className="max-w-xl mx-auto text-center reveal">
            <p className="text-[10px] tracking-[0.4em] uppercase text-stone-600 font-medium mb-12">
              Counting down to the big day
            </p>
            <div className="grid grid-cols-4 gap-3 sm:gap-6">
              {(
                [
                  { value: countdown.days, label: "Days" },
                  { value: countdown.hours, label: "Hours" },
                  { value: countdown.minutes, label: "Mins" },
                  { value: countdown.seconds, label: "Secs" },
                ] as const
              ).map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center gap-3">
                  <div className="relative w-full aspect-square max-w-[76px] flex items-center justify-center border border-stone-800/60 bg-stone-900/20">
                    {/* Corner accents */}
                    <span className="absolute top-0 left-0 w-2.5 h-px bg-amber-400/30" />
                    <span className="absolute top-0 left-0 w-px h-2.5 bg-amber-400/30" />
                    <span className="absolute top-0 right-0 w-2.5 h-px bg-amber-400/30" />
                    <span className="absolute top-0 right-0 w-px h-2.5 bg-amber-400/30" />
                    <span className="absolute bottom-0 left-0 w-2.5 h-px bg-amber-400/30" />
                    <span className="absolute bottom-0 left-0 w-px h-2.5 bg-amber-400/30" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-px bg-amber-400/30" />
                    <span className="absolute bottom-0 right-0 w-px h-2.5 bg-amber-400/30" />
                    <span
                      style={{
                        fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                        fontSize: "clamp(1.6rem, 5vw, 2rem)",
                        fontWeight: 300,
                        color: "#f0ece4",
                        lineHeight: 1,
                      }}
                    >
                      {pad(value)}
                    </span>
                  </div>
                  <span className="text-[8px] tracking-[0.25em] uppercase text-stone-700 font-medium">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COUPLE ───────────────────────────────────────── */}
        <section id="couple" className="py-32 px-6 bg-[#080808]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-24 reveal">
              <p className="text-[10px] tracking-[0.5em] uppercase text-stone-600 font-medium mb-4">
                Two hearts, one destiny
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                  fontWeight: 300,
                  color: "#f0ece4",
                }}
              >
                The Couple
              </h2>
            </div>

            {/* Bride */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20 mb-28 reveal">
              <div className="w-60 md:w-72 shrink-0">
                <div
                  className="aspect-[3/4] overflow-hidden border border-stone-800/40"
                  style={{ borderRadius: "50% 50% 50% 50% / 55% 55% 45% 45%" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1594938298603-c8148c4b4e10?q=80&w=800&auto=format&fit=crop"
                    alt="The Bride"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    style={{ filter: "sepia(0.2) saturate(0.7) brightness(0.8)" }}
                  />
                </div>
              </div>
              <div className="text-center md:text-left space-y-5 flex-1">
                <span className="text-[9px] tracking-[0.45em] uppercase text-amber-400/50 font-medium">
                  The Bride
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                    fontSize: "clamp(2rem, 4vw, 3.25rem)",
                    fontWeight: 300,
                    color: "#f0ece4",
                    lineHeight: 1.1,
                  }}
                >
                  Mila Arinda
                </h2>
                <div className="space-y-1 text-sm text-stone-500 font-light">
                  <p className="italic text-stone-700 text-xs">Daughter of:</p>
                  <p>Bapak Ahmad Rahmad &amp; Ibu Siti Nurhasanah</p>
                </div>
                <div className="flex items-center gap-3 pt-2 justify-center md:justify-start">
                  <div className="w-8 h-px bg-stone-800" />
                  <span className="text-[9px] tracking-[0.2em] uppercase text-stone-700">
                    @milaarinda
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center gap-6 mb-28 reveal">
              <div className="flex-1 max-w-[120px] h-px bg-stone-800/60" />
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  className="text-amber-400/15"
                >
                  <polygon
                    points="28,1 55,28 28,55 1,28"
                    stroke="currentColor"
                    strokeWidth="0.7"
                    fill="none"
                  />
                  <polygon
                    points="28,10 46,28 28,46 10,28"
                    stroke="currentColor"
                    strokeWidth="0.4"
                    fill="none"
                  />
                </svg>
                <span
                  className="absolute italic"
                  style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                    fontSize: "1.5rem",
                    fontWeight: 300,
                    color: "rgba(201, 169, 110, 0.35)",
                  }}
                >
                  &amp;
                </span>
              </div>
              <div className="flex-1 max-w-[120px] h-px bg-stone-800/60" />
            </div>

            {/* Groom */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-20 reveal">
              <div className="w-60 md:w-72 shrink-0">
                <div
                  className="aspect-[3/4] overflow-hidden border border-stone-800/40"
                  style={{ borderRadius: "50% 50% 50% 50% / 55% 55% 45% 45%" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"
                    alt="The Groom"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    style={{ filter: "sepia(0.2) saturate(0.7) brightness(0.8)" }}
                  />
                </div>
              </div>
              <div className="text-center md:text-right space-y-5 flex-1">
                <span className="text-[9px] tracking-[0.45em] uppercase text-amber-400/50 font-medium">
                  The Groom
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                    fontSize: "clamp(2rem, 4vw, 3.25rem)",
                    fontWeight: 300,
                    color: "#f0ece4",
                    lineHeight: 1.1,
                  }}
                >
                  Ardy Surya
                </h2>
                <div className="space-y-1 text-sm text-stone-500 font-light">
                  <p className="italic text-stone-700 text-xs">Son of:</p>
                  <p>Bapak Hendra Pratama &amp; Ibu Dewi Lestari</p>
                </div>
                <div className="flex items-center gap-3 pt-2 justify-center md:justify-end">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-stone-700">
                    @ardysurya
                  </span>
                  <div className="w-8 h-px bg-stone-800" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SCHEDULE ─────────────────────────────────────── */}
        <section
          id="schedule"
          className="py-32 px-6 border-y border-white/[0.04]"
          style={{ background: "linear-gradient(to bottom, #0c0c0c, #080808)" }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20 reveal">
              <p className="text-[10px] tracking-[0.5em] uppercase text-stone-600 font-medium mb-4">
                We await your presence
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                  fontWeight: 300,
                  color: "#f0ece4",
                }}
              >
                Event Schedule
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                {
                  icon: (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </>
                  ),
                  label: "Holy Matrimony",
                  day: "Saturday, June 13th, 2026",
                  time: "09:00 WIB",
                  venue: "Masjid Istiqlal, Jakarta Pusat",
                },
                {
                  icon: (
                    <>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </>
                  ),
                  label: "Wedding Reception",
                  day: "Sunday, June 14th, 2026",
                  time: "11:00 – 15:00 WIB",
                  venue: "Grand Ballroom, Hotel Mulia, Jakarta",
                },
              ].map((ev) => (
                <div
                  key={ev.label}
                  className="reveal relative p-10 border border-stone-800/40 bg-stone-900/10 flex flex-col items-center text-center group hover:border-amber-400/15 hover:bg-stone-900/25 transition-all duration-500"
                >
                  {/* Animated corner accents */}
                  <span className="absolute top-0 left-0 w-5 h-px bg-amber-400/20 group-hover:w-10 transition-all duration-500" />
                  <span className="absolute top-0 left-0 h-5 w-px bg-amber-400/20 group-hover:h-10 transition-all duration-500" />
                  <span className="absolute bottom-0 right-0 w-5 h-px bg-amber-400/20 group-hover:w-10 transition-all duration-500" />
                  <span className="absolute bottom-0 right-0 h-5 w-px bg-amber-400/20 group-hover:h-10 transition-all duration-500" />

                  <div className="w-14 h-14 border border-stone-800/60 flex items-center justify-center mb-7 text-amber-400/40 group-hover:border-amber-400/25 group-hover:text-amber-400/60 transition-all duration-500">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {ev.icon}
                    </svg>
                  </div>
                  <h3
                    className="mb-3"
                    style={{
                      fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                      fontSize: "1.5rem",
                      fontWeight: 400,
                      color: "#f0ece4",
                    }}
                  >
                    {ev.label}
                  </h3>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-stone-500 font-medium mb-1">
                    {ev.day}
                  </p>
                  <p className="text-sm text-stone-600 font-light mb-5">{ev.time}</p>
                  <p className="text-sm text-stone-500 font-light leading-relaxed mb-6 max-w-[260px]">
                    {ev.venue}
                  </p>
                  <a
                    href="#"
                    className="text-[9px] tracking-[0.3em] uppercase text-stone-600 border-b border-stone-800/60 pb-0.5 hover:text-amber-400/60 hover:border-amber-400/30 transition-colors"
                  >
                    View on Map
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GALLERY ──────────────────────────────────────── */}
        <section id="gallery" className="py-32 px-6 bg-[#080808]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 reveal">
              <p className="text-[10px] tracking-[0.5em] uppercase text-stone-600 font-medium mb-4">
                A glimpse into our story
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                  fontWeight: 300,
                  color: "#f0ece4",
                }}
              >
                Our Moments
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 reveal">
              {/* Col 1 */}
              <div className="flex flex-col gap-3 md:gap-4">
                <div className="overflow-hidden aspect-[2/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop"
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                    style={{ filter: "sepia(0.35) saturate(0.5) brightness(0.65)" }}
                  />
                </div>
                <div className="overflow-hidden aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=800&auto=format&fit=crop"
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                    style={{ filter: "sepia(0.35) saturate(0.5) brightness(0.65)" }}
                  />
                </div>
              </div>

              {/* Col 2 */}
              <div className="flex flex-col gap-3 md:gap-4 md:mt-10">
                <div className="overflow-hidden aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop"
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                    style={{ filter: "sepia(0.35) saturate(0.5) brightness(0.65)" }}
                  />
                </div>
                <div className="overflow-hidden aspect-[2/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop"
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                    style={{ filter: "sepia(0.35) saturate(0.5) brightness(0.65)" }}
                  />
                </div>
              </div>

              {/* Col 3 */}
              <div className="hidden md:flex flex-col gap-4">
                <div className="overflow-hidden aspect-[2/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop"
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                    style={{ filter: "sepia(0.35) saturate(0.5) brightness(0.65)" }}
                  />
                </div>
                <div className="overflow-hidden aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop"
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                    style={{ filter: "sepia(0.35) saturate(0.5) brightness(0.65)" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── GIFT ─────────────────────────────────────────── */}
        <section
          id="gift"
          className="py-32 px-6 border-t border-white/[0.04]"
          style={{ background: "linear-gradient(to bottom, #080808, #0c0c0c)" }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16 reveal">
              <p className="text-[10px] tracking-[0.5em] uppercase text-stone-600 font-medium mb-4">
                Your generosity means the world
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                  fontWeight: 300,
                  color: "#f0ece4",
                }}
              >
                Wedding Gift
              </h2>
              <p className="mt-4 text-sm text-stone-600 font-light max-w-md mx-auto leading-relaxed">
                Your presence is the greatest gift of all. If you wish to bless us
                with a gift, a contribution to our account would be warmly
                appreciated.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 reveal">
              {/* Account 1 */}
              <div className="relative p-8 border border-stone-800/40 bg-stone-900/15 group hover:border-amber-400/15 transition-colors duration-500">
                <span className="absolute top-0 left-0 w-5 h-px bg-amber-400/20 group-hover:w-10 transition-all duration-500" />
                <span className="absolute top-0 left-0 h-5 w-px bg-amber-400/20 group-hover:h-10 transition-all duration-500" />
                <span className="absolute bottom-0 right-0 w-5 h-px bg-amber-400/20 group-hover:w-10 transition-all duration-500" />
                <span className="absolute bottom-0 right-0 h-5 w-px bg-amber-400/20 group-hover:h-10 transition-all duration-500" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 border border-stone-800/60 flex items-center justify-center text-amber-400/40 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <span className="text-[9px] tracking-[0.35em] uppercase text-stone-600 font-medium">
                    Bank Transfer
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-stone-700 mb-1">Bank</p>
                    <p className="text-sm text-stone-300 font-light">Bank Central Asia (BCA)</p>
                  </div>
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-stone-700 mb-1">Account Name</p>
                    <p className="text-sm text-stone-300 font-light">Ardy Surya</p>
                  </div>
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-stone-700 mb-1">Account Number</p>
                    <p
                      className="text-stone-100 tracking-widest"
                      style={{
                        fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                        fontSize: "1.4rem",
                        fontWeight: 400,
                        letterSpacing: "0.12em",
                      }}
                    >
                      1234 5678 90
                    </p>
                  </div>
                </div>

                <CopyButton value="1234567890" />
              </div>

              {/* Account 2 */}
              <div className="relative p-8 border border-stone-800/40 bg-stone-900/15 group hover:border-amber-400/15 transition-colors duration-500">
                <span className="absolute top-0 left-0 w-5 h-px bg-amber-400/20 group-hover:w-10 transition-all duration-500" />
                <span className="absolute top-0 left-0 h-5 w-px bg-amber-400/20 group-hover:h-10 transition-all duration-500" />
                <span className="absolute bottom-0 right-0 w-5 h-px bg-amber-400/20 group-hover:w-10 transition-all duration-500" />
                <span className="absolute bottom-0 right-0 h-5 w-px bg-amber-400/20 group-hover:h-10 transition-all duration-500" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 border border-stone-800/60 flex items-center justify-center text-amber-400/40 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <span className="text-[9px] tracking-[0.35em] uppercase text-stone-600 font-medium">
                    Bank Transfer
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-stone-700 mb-1">Bank</p>
                    <p className="text-sm text-stone-300 font-light">Mandiri</p>
                  </div>
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-stone-700 mb-1">Account Name</p>
                    <p className="text-sm text-stone-300 font-light">Mila Arinda</p>
                  </div>
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-stone-700 mb-1">Account Number</p>
                    <p
                      className="text-stone-100 tracking-widest"
                      style={{
                        fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                        fontSize: "1.4rem",
                        fontWeight: 400,
                        letterSpacing: "0.12em",
                      }}
                    >
                      0987 6543 21
                    </p>
                  </div>
                </div>

                <CopyButton value="0987654321" />
              </div>
            </div>
          </div>
        </section>

        {/* ── WISHES ───────────────────────────────────────── */}
        <section
          id="wishes"
          className="py-32 px-6 border-t border-white/[0.04]"
          style={{ background: "linear-gradient(to bottom, #0c0c0c, #080808)" }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20 reveal">
              <p className="text-[10px] tracking-[0.5em] uppercase text-stone-600 font-medium mb-4">
                Share your love
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                  fontWeight: 300,
                  color: "#f0ece4",
                }}
              >
                Wishes &amp; Blessings
              </h2>
              <p className="mt-4 text-sm text-stone-600 font-light">
                Leave a note or well wish for the couple
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 md:gap-16 lg:gap-24">
              {/* Form */}
              <div className="reveal">
                <h3 className="text-[10px] tracking-[0.35em] uppercase text-stone-600 font-medium mb-8">
                  Leave a Message
                </h3>

                {wishSuccess ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
                    <div className="relative w-14 h-14 flex items-center justify-center border border-amber-400/25">
                      <span className="absolute top-0 left-0 w-3 h-px bg-amber-400/40" />
                      <span className="absolute top-0 left-0 h-3 w-px bg-amber-400/40" />
                      <span className="absolute bottom-0 right-0 w-3 h-px bg-amber-400/40" />
                      <span className="absolute bottom-0 right-0 h-3 w-px bg-amber-400/40" />
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        className="text-amber-400/50"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                        fontSize: "1.75rem",
                        color: "#f0ece4",
                        fontWeight: 300,
                      }}
                    >
                      Thank You
                    </p>
                    <p className="text-sm text-stone-500 font-light max-w-xs">
                      Your beautiful message has been received with love.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWishSubmit} className="space-y-8">
                    <div>
                      <label className="block text-[9px] tracking-[0.3em] uppercase text-stone-700 mb-3">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={wishName}
                        onChange={(e) => setWishName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full bg-transparent border-b border-stone-800/80 pb-3 text-sm text-stone-300 placeholder-stone-800 outline-none focus:border-amber-400/30 transition-colors duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-[0.3em] uppercase text-stone-700 mb-3">
                        Your Wishes
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={wishMessage}
                        onChange={(e) => setWishMessage(e.target.value)}
                        placeholder="Write your well wishes here..."
                        className="w-full bg-transparent border-b border-stone-800/80 pb-3 text-sm text-stone-300 placeholder-stone-800 outline-none resize-none focus:border-amber-400/30 transition-colors duration-300"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-4 text-[10px] tracking-[0.35em] uppercase font-medium border border-stone-700/60 text-stone-500 hover:bg-stone-100 hover:text-stone-900 hover:border-stone-100 transition-all duration-500 mt-2 cursor-pointer"
                    >
                      Send Wishes
                    </button>
                  </form>
                )}
              </div>

              {/* Wishes list */}
              <div className="reveal">
                <h3 className="text-[10px] tracking-[0.35em] uppercase text-stone-600 font-medium mb-8 flex items-center gap-3">
                  Messages
                  <span className="text-stone-800 font-normal">
                    ({wishes.length})
                  </span>
                </h3>
                <div className="h-[420px] overflow-y-auto wish-scroll pr-3 space-y-7">
                  {wishes.map((wish) => (
                    <div
                      key={wish.id}
                      className="border-b border-stone-800/30 pb-7 last:border-0"
                    >
                      <div className="flex items-baseline gap-3 mb-2.5">
                        <h4 className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-medium">
                          {wish.name}
                        </h4>
                        <span className="text-[9px] text-stone-700 uppercase tracking-wider">
                          {wish.date}
                        </span>
                      </div>
                      <p
                        className="text-stone-500 font-light italic leading-relaxed"
                        style={{
                          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                          fontSize: "1.05rem",
                        }}
                      >
                        &ldquo;{wish.message}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CLOSING ──────────────────────────────────────── */}
        <section
          className="py-24 px-6 text-center"
          style={{ background: "linear-gradient(to bottom, #080808, #040404)" }}
        >
          <div className="max-w-xl mx-auto reveal">
            <Diamond size={14} className="text-amber-400/20 mx-auto mb-8" />
            <p className="text-sm text-stone-600 font-light leading-relaxed italic mb-8">
              It is an honor and happiness for us if you could bless our union.
              <br />
              With love, we sincerely thank you.
            </p>
            <h2
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 300,
                color: "#f0ece4",
              }}
            >
              Ardy Surya{" "}
              <span
                className="italic"
                style={{ color: "rgba(201, 169, 110, 0.5)", fontWeight: 300 }}
              >
                &amp;
              </span>{" "}
              Mila Arinda
            </h2>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────── */}
        <footer className="py-10 text-center bg-[#040404] border-t border-white/[0.03]">
          <div className="flex items-center justify-center gap-5 mb-4">
            <div className="w-14 h-px bg-stone-900" />
            <Diamond size={10} className="text-stone-800" />
            <div className="w-14 h-px bg-stone-900" />
          </div>
          <p className="text-[9px] tracking-[0.35em] uppercase text-stone-800">
            June 14, 2026 · Jakarta, Indonesia
          </p>
        </footer>
      </div>
    </div>
  );
}
