"use client";

import { useEffect, useRef, useState } from "react";

const CODE = "123456";
const CELL = 132; // reel cell height in px, must match the window height
const CYCLES = 9; // how many symbol loops before landing
const WIN = "triangle"; // every reel lands here, and it appears nowhere else
const SYMBOLS = ["cherry", "lemon", "bell", "star", "seven"];

type Phase = "entry" | "spinning" | "jackpot";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("entry");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const [focused, setFocused] = useState(0);
  const [landed, setLanded] = useState<number[]>([]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const entered = digits.join("");

  // auto-submit once all six boxes are filled
  useEffect(() => {
    if (phase !== "entry" || entered.length !== 6) return;
    if (entered === CODE) {
      // hold long enough for the sixth digit to actually be seen
      const go = setTimeout(() => setPhase("spinning"), 420);
      return () => clearTimeout(go);
    } else {
      setError(true);
      const t = setTimeout(() => {
        setError(false);
        setDigits(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      }, 700);
      return () => clearTimeout(t);
    }
  }, [entered, phase]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, [phase]);

  const type = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "");
    if (!v) {
      setDigits((d) => d.map((x, j) => (j === i ? "" : x)));
      return;
    }
    // handle paste of the whole code
    setDigits((d) => {
      const next = [...d];
      for (let k = 0; k < v.length && i + k < 6; k++) next[i + k] = v[k];
      return next;
    });
    const landing = Math.min(i + v.length, 5);
    inputs.current[landing]?.focus();
  };

  const back = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  return (
    <main className="stage-bg relative flex min-h-dvh flex-col items-center justify-center gap-14 overflow-hidden p-6 text-[#ededed]">
      {/* one chip above the deck: says what the boxes are, then says you won */}
      {phase === "jackpot" ? (
        <button
          onClick={() => {
            setDigits(["", "", "", "", "", ""]);
            setLanded([]);
            setPhase("entry");
          }}
          className="chip chip-win pop"
        >
          <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
            <path
              d="m4.5 12.5 5 5 10-11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Verified
        </button>
      ) : (
        <div className="chip">
          <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
            <path
              d="M8 10V7.5a4 4 0 0 1 8 0V10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <rect x="4.8" y="10" width="14.4" height="9.6" rx="2.6" fill="currentColor" />
          </svg>
          Verification code
        </div>
      )}

      {/* the six slots, double as reels — tilted in 3d so they read as objects */}
      <div className="stage">
        <div className={`deck ${error ? "shake" : ""}`}>
          {digits.map((d, i) => (
            <div
              key={i}
              className={`cell ${error ? "cell-error" : ""} ${
                phase === "jackpot" ? "jackpot-cell" : ""
              } ${phase === "entry" && focused === i ? "cell-focus" : ""} ${
                landed.includes(i) && phase !== "jackpot" ? "cell-lock" : ""
              }`}
              style={{ "--i": i } as React.CSSProperties}
            >
              {phase === "spinning" || phase === "jackpot" ? (
                <span className="window">
                  <Reel
                    index={i}
                    onDone={() => {
                      setLanded((l) => [...l, i]);
                      // the bounce runs early by design; the win label waits
                      // for the last reel to actually come to rest
                      if (i === 5) setTimeout(() => setPhase("jackpot"), 450);
                    }}
                  />
                </span>
              ) : (
                <input
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => type(i, e.target.value)}
                  onKeyDown={(e) => back(i, e)}
                  onFocus={() => setFocused(i)}
                  inputMode="numeric"
                  maxLength={6}
                  aria-label={`digit ${i + 1}`}
                  className="relative z-20 h-full w-full bg-transparent text-center text-5xl font-semibold tracking-[-0.04em] tabular-nums text-[#ededed] caret-transparent outline-none"
                />
              )}
              {phase === "jackpot" && <span className="shine" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}

// vintage reel print: heavy black outline, flat red/yellow, white specular pops
const LINE = "#a1a1a1"; // gray-700-ish for the losing symbols
const RED = "#616161";
const YELLOW = "#8f8f8f";
const PAPER = "#0a0a0a";
const ACCENT = "#0070f3";

function Glyph({ name, size = 52 }: { name: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke={LINE}
      fill="none"
      strokeWidth="1.25"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      {GLYPHS[name]}
    </svg>
  );
}

const GLYPHS: Record<string, React.ReactElement> = {
  cherry: (
    <>
      <path d="M12.6 4.4C10 6.9 7.6 10.2 6.9 13.1" fill="none" />
      <path d="M12.6 4.4c2 3 3.5 6 4.1 8.8" fill="none" />
      <path d="M12.6 4.4c2.2-1.7 4.7-1.8 6.2.1-2.1 1.5-4.4 1.4-6.2-.1Z" fill={LINE} />
      <circle cx="6.6" cy="17.1" r="4.3" fill={RED} />
      <circle cx="16.8" cy="17.6" r="3.9" fill={RED} />
      <path d="M4.9 15.9a2.4 2.4 0 0 1 1.6-1.3" fill="none" stroke={PAPER} strokeWidth="1.3" />
      <path d="M15.4 16.6a2.1 2.1 0 0 1 1.4-1.1" fill="none" stroke={PAPER} strokeWidth="1.2" />
    </>
  ),
  lemon: (
    <>
      <ellipse cx="12" cy="12" rx="8" ry="5.4" transform="rotate(-22 12 12)" fill={YELLOW} />
      <path d="M7.6 9.6a5.6 5.6 0 0 1 3.2-1.9" fill="none" stroke={PAPER} strokeWidth="1.4" />
    </>
  ),
  bell: (
    <>
      <path d="M12 3.4A6.3 6.3 0 0 0 5.7 9.7v3.6L3.7 17h16.6l-2-3.7V9.7A6.3 6.3 0 0 0 12 3.4Z" fill={YELLOW} />
      <path d="M8.6 12.6V9.9a3.5 3.5 0 0 1 1.9-3.1" fill="none" stroke={PAPER} strokeWidth="1.4" />
      <circle cx="12" cy="19.3" r="2.1" fill={LINE} />
    </>
  ),
  star: (
    <path d="M12 2.6l2.9 6 6.5.9-4.7 4.5 1.1 6.4L12 17.4l-5.8 3 1.1-6.4L2.6 9.5l6.5-.9Z" fill={YELLOW} />
  ),
  seven: (
    <>
      <path d="M5.6 3.9h12.8v3L12 20.1H7.1l6.1-12.6H5.6Z" fill={RED} />
      <path d="M7.4 5.7h4.4" fill="none" stroke={PAPER} strokeWidth="1.3" />
    </>
  ),
  triangle: <path d="M12 1 24 22H0Z" fill="#c4c4c4" stroke="none" />,
  diamond: (
    <>
      <path d="M6.6 3.9h10.8l4 4.9L12 20.3 2.6 8.8Z" fill={ACCENT} />
      <path d="M6.6 3.9 9.2 8.8 12 3.9l2.8 4.9 2.6-4.9M2.6 8.8h18.8M9.2 8.8 12 20.3l2.8-11.5" fill="none" strokeWidth="1.1" />
      <path d="M4.6 7.2 6.4 5.3" fill="none" stroke={PAPER} strokeWidth="1.2" />
    </>
  ),
};

function Reel({ index, onDone }: { index: number; onDone?: () => void }) {
  const [spun, setSpun] = useState(false);
  // the loop never shows the diamond — it turns up only as the landing symbol
  const strip = [...Array(CYCLES).fill(0).flatMap(() => SYMBOLS), WIN];
  const last = strip.length - 1;
  // slower overall, and a longer gap between each reel so they land one by one
  const duration = 1.9 + index * 0.55;

  const done = useRef(false);

  const land = () => {
    if (done.current) return;
    done.current = true;
    onDone?.();
  };

  useEffect(() => {
    const t = requestAnimationFrame(() => setSpun(true));
    // the ease-out has a long slow tail, so the diamond reads as "arrived"
    // well before the transition formally ends — bounce on that moment instead
    const bounce = setTimeout(land, duration * 1000 - 450);
    return () => {
      cancelAnimationFrame(t);
      clearTimeout(bounce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="absolute inset-x-0 top-0"
      // the reel is locked in the moment the transition actually ends —
      // a timer started a frame earlier and drifted out of sync with it
      onTransitionEnd={(e) => {
        if (e.propertyName === "transform") land();
      }}
      style={{
        transform: `translateY(${spun ? -last * CELL : 0}px)`,
        transition: `transform ${duration}s cubic-bezier(0.16, 0.9, 0.2, 1)`,
      }}
    >
      {strip.map((n, k) => (
        <div
          key={k}
          className="flex items-center justify-center"
          style={{ height: CELL }}
        >
          <Glyph name={n} />
        </div>
      ))}
    </div>
  );
}
