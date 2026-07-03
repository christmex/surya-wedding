"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

/** SHA-256 of the access password (plaintext is never stored in source or bundle). */
const ACCESS_PASSWORD_HASH = "eecee435ed4a051e361f6918750054c45eedce84cd5bbe380ee24f50db4e26fd";
const SESSION_STORAGE_KEY = "guests-access-granted";

async function sha256Hex(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(SESSION_STORAGE_KEY) === "1");
    setChecked(true);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(false);
    const enteredHash = await sha256Hex(password);
    if (enteredHash === ACCESS_PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setPassword("");
    }
    setSubmitting(false);
  };

  // Avoid flashing the password form before we know the session state.
  if (!checked) {
    return <div className="min-h-screen bg-[#080808]" />;
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <main
      className="min-h-screen bg-[#080808] flex items-center justify-center px-5"
      style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
    >
      <form onSubmit={submit} className="w-full max-w-xs text-center">
        <div className="flex justify-center mb-6 text-amber-400/70">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>

        <p className="text-[9px] tracking-[0.4em] uppercase text-amber-400/70">Akses Terbatas</p>
        <h1
          className="mt-3 mb-8 text-stone-100"
          style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.75rem, 6vw, 2.25rem)", fontWeight: 300 }}
        >
          Masukkan Kode Akses
        </h1>

        <input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(false);
          }}
          autoFocus
          placeholder="Kode akses"
          className="w-full bg-transparent border border-stone-700/70 px-4 py-3 text-sm text-center tracking-[0.15em] text-stone-200 outline-none focus:border-amber-400/40 transition-colors"
        />

        {error && <p className="mt-3 text-[11px] text-red-400/80">Kode akses salah.</p>}

        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="mt-6 w-full py-3 text-[9px] tracking-[0.3em] uppercase border border-stone-600/60 text-stone-300 hover:border-amber-400/40 hover:text-amber-300 transition-colors duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Memeriksa…" : "Masuk"}
        </button>
      </form>
    </main>
  );
}
