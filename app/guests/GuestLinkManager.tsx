"use client";

import { useEffect, useMemo, useState } from "react";
import { GUEST_NAMES } from "./guestList";

/** Guests shown per page in the list. */
const PAGE_SIZE = 20;

/** Group codes the couple appended to disambiguate guests (not part of a greeting). */
const GROUP_CODES = ["BN", "STCA", "URCL", "URC"];
const TRAILING_GROUP_CODE = new RegExp(`\\s+(?:${GROUP_CODES.join("|")})$`, "i");

const INVITATION_TEMPLATE_DEFAULT =
  "Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir serta memberikan doa restu pada hari bahagia pernikahan kami.\n\n" +
  "Untuk melihat detail acara, silakan membuka undangan digital melalui tautan berikut:\n\n" +
  "{link}\n\n" +
  "Merupakan kebahagiaan yang tak ternilai bagi kami apabila Bapak/Ibu/Saudara/i dapat berkenan hadir.\n" +
  "Terima kasih atas doa dan restunya.";

/** Strip a trailing group code (e.g. "Sherly BN" → "Sherly") for the guest-facing greeting. */
function cleanName(name: string): string {
  return name.replace(TRAILING_GROUP_CODE, "").trim();
}

function buildInviteUrl(baseUrl: string, guestName: string): string {
  const normalizedBase = baseUrl.trim().replace(/\/+$/, "");
  return `${normalizedBase}/?to=${encodeURIComponent(guestName)}`;
}

function buildMessage(template: string, displayName: string, inviteUrl: string): string {
  return template.replaceAll("{nama}", displayName).replaceAll("{link}", inviteUrl);
}

function buildWhatsappUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers without the async clipboard API.
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      onClick={copy}
      className={`shrink-0 px-4 py-2 text-[9px] tracking-[0.25em] uppercase border transition-colors duration-300 cursor-pointer flex items-center gap-2 ${
        copied
          ? "border-amber-400/40 text-amber-300"
          : "border-stone-600/60 text-stone-300 hover:border-amber-400/40 hover:text-amber-300"
      }`}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Tersalin
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Salin Undangan
        </>
      )}
    </button>
  );
}

export default function GuestLinkManager() {
  const [baseUrl, setBaseUrl] = useState("");
  const [query, setQuery] = useState("");
  const [cleanCodes, setCleanCodes] = useState(false);
  const [template, setTemplate] = useState(INVITATION_TEMPLATE_DEFAULT);
  const [showTemplate, setShowTemplate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const filteredGuests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return GUEST_NAMES;
    return GUEST_NAMES.filter((name) => name.toLowerCase().includes(normalizedQuery));
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageGuests = filteredGuests.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <main
      className="min-h-screen bg-[#080808] text-stone-200 px-5 py-14 sm:px-8"
      style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="text-center mb-10">
          <p className="text-[9px] tracking-[0.4em] uppercase text-amber-400/70">Panel Undangan</p>
          <h1
            className="mt-3 text-stone-100"
            style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 300 }}
          >
            Generator Link Tamu
          </h1>
          <p className="mt-2 text-xs text-stone-500 leading-relaxed">
            Klik <span className="text-stone-300">Salin Undangan</span> untuk menyalin teks undangan lengkap tiap tamu,
            atau <span className="text-stone-300">WA</span> untuk langsung mengirim.
          </p>
        </header>

        {/* Base URL */}
        <label className="block mb-5">
          <span className="block text-[9px] tracking-[0.3em] uppercase text-stone-500 mb-2">Domain Undangan</span>
          <input
            type="text"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://domain.com"
            className="w-full bg-transparent border border-stone-700/70 px-4 py-3 text-sm text-stone-200 outline-none focus:border-amber-400/40 transition-colors"
          />
        </label>

        {/* Options */}
        <div className="flex flex-col gap-3 mb-5">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={cleanCodes}
              onChange={(event) => setCleanCodes(event.target.checked)}
              className="mt-0.5 accent-amber-500"
            />
            <span className="text-xs text-stone-400 leading-relaxed">
              Hilangkan kode grup (<span className="text-stone-300">{GROUP_CODES.join(", ")}</span>) dari sapaan tamu.
              <br />
              <span className="text-stone-600">Contoh: &quot;Sherly BN&quot; disapa &quot;Sherly&quot;. Nama di daftar tetap lengkap agar mudah dicari.</span>
            </span>
          </label>

          <button
            onClick={() => setShowTemplate((previous) => !previous)}
            className="self-start text-[10px] tracking-[0.2em] uppercase text-stone-500 hover:text-amber-300 transition-colors cursor-pointer"
          >
            {showTemplate ? "− Sembunyikan pesan undangan" : "+ Ubah pesan undangan"}
          </button>

          {showTemplate && (
            <div>
              <textarea
                value={template}
                onChange={(event) => setTemplate(event.target.value)}
                rows={9}
                className="w-full bg-transparent border border-stone-700/70 px-4 py-3 text-xs text-stone-300 outline-none focus:border-amber-400/40 transition-colors leading-relaxed"
              />
              <p className="mt-1 text-[10px] text-stone-600">
                Gunakan <span className="text-stone-400">{"{nama}"}</span> untuk nama tamu dan{" "}
                <span className="text-stone-400">{"{link}"}</span> untuk link undangan.
              </p>
            </div>
          )}
        </div>

        {/* Search */}
        <label className="block mb-3">
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama tamu…"
            className="w-full bg-transparent border border-stone-700/70 px-4 py-3 text-sm text-stone-200 outline-none focus:border-amber-400/40 transition-colors"
          />
        </label>

        <p className="text-[10px] tracking-[0.2em] uppercase text-stone-600 mb-6">
          {filteredGuests.length} dari {GUEST_NAMES.length} tamu
        </p>

        {/* Guest list */}
        <ul className="flex flex-col gap-2">
          {pageGuests.map((name) => {
            const displayName = cleanCodes ? cleanName(name) : name;
            const inviteUrl = buildInviteUrl(baseUrl, displayName);
            const message = buildMessage(template, displayName, inviteUrl);
            const whatsappUrl = buildWhatsappUrl(message);

            return (
              <li
                key={name}
                className="flex flex-col gap-3 sm:flex-row sm:items-center border border-white/[0.06] bg-white/[0.015] px-4 py-3 hover:border-white/[0.12] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-stone-100 truncate" title={name}>
                    {name}
                  </p>
                  <p className="text-[11px] text-stone-600 truncate" title={inviteUrl}>
                    {inviteUrl}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-2 text-[9px] tracking-[0.25em] uppercase border border-stone-600/60 text-stone-300 hover:border-emerald-400/40 hover:text-emerald-300 transition-colors duration-300 flex items-center gap-2"
                  title="Kirim via WhatsApp"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.06c-.24.68-1.42 1.32-1.95 1.37-.53.05-1.02.24-3.42-.71-2.9-1.14-4.74-4.11-4.88-4.3-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.42-.07.65.5.24.58.81 2 .88 2.14.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.17-.3.38-.43.5-.14.14-.29.29-.12.57.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.42.29.14.45.12.62-.07.17-.19.71-.83.9-1.12.19-.29.38-.24.65-.14.26.1 1.67.79 1.96.93.29.14.48.22.55.34.07.12.07.68-.17 1.36z" />
                  </svg>
                  WA
                </a>

                <CopyMessageButton text={message} />
                </div>
              </li>
            );
          })}
        </ul>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-5">
            <button
              onClick={() => setCurrentPage(safePage - 1)}
              disabled={safePage <= 1}
              className="px-4 py-2 text-[9px] tracking-[0.25em] uppercase border border-stone-600/60 text-stone-300 hover:border-amber-400/40 hover:text-amber-300 transition-colors duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-stone-600/60 disabled:hover:text-stone-300"
            >
              Sebelumnya
            </button>
            <span className="text-[10px] tracking-[0.2em] uppercase text-stone-500">
              Halaman {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="px-4 py-2 text-[9px] tracking-[0.25em] uppercase border border-stone-600/60 text-stone-300 hover:border-amber-400/40 hover:text-amber-300 transition-colors duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-stone-600/60 disabled:hover:text-stone-300"
            >
              Berikutnya
            </button>
          </div>
        )}

        {filteredGuests.length === 0 && (
          <p className="text-center text-sm text-stone-600 py-10">Tidak ada tamu yang cocok.</p>
        )}
      </div>
    </main>
  );
}
