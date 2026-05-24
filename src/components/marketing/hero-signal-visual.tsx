"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const WAVEFORM = [
  18, 28, 14, 42, 22, 36, 68, 30, 52, 24, 78, 32, 48, 20, 58, 26, 72, 18, 44, 28, 38, 22, 54, 30, 62, 24, 40, 16,
];

const ORBIT_PEOPLE = [
  { img: 11, status: "green" as const },
  { img: 32, status: "purple" as const },
  { img: 45, status: "green" as const },
  { img: 12, status: "purple" as const },
  { img: 28, status: "green" as const },
  { img: 53, status: "purple" as const },
  { img: 19, status: "green" as const },
  { img: 47, status: "purple" as const },
  { img: 33, status: "green" as const },
  { img: 64, status: "purple" as const },
];

const STATUS_DOT = {
  green: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]",
  purple: "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)]",
};

/** Spoke length from center to avatar center — matches the 92% guide ring (radius ≈ 46%). */
const ORBIT_RADIUS_PERCENT = 46;

/** Fixed avatar footprint on all breakpoints (avoids sm: size jumps and layout drift). */
const AVATAR_PX = 56;

export function HeroSignalVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      className="relative mx-auto aspect-square w-full max-w-[min(100%,520px)] min-h-[320px] lg:min-h-0"
    >
      <motion.div
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_42%_38%,hsl(var(--primary)/0.22),transparent_48%),radial-gradient(circle_at_68%_62%,hsl(280_80%_60%/0.14),transparent_42%),radial-gradient(circle_at_center,hsl(var(--accent)/0.08),transparent_55%)]"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      {[
        "left-[12%] top-[18%]",
        "left-[78%] top-[22%]",
        "left-[8%] top-[55%]",
        "right-[10%] top-[48%]",
        "left-[22%] bottom-[12%]",
        "right-[18%] bottom-[16%]",
        "left-[48%] top-[8%]",
        "right-[28%] bottom-[8%]",
      ].map((pos, i) => (
        <span
          key={pos}
          className={cn("absolute h-1 w-1 rounded-full bg-primary/40", pos)}
          style={{ opacity: 0.35 + (i % 3) * 0.2 }}
        />
      ))}

      {[92, 78, 64].map((size) => (
        <motion.div
          key={size}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15"
          style={{ width: `${size}%`, height: `${size}%` }}
          animate={{ opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 5 + size * 0.02, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[50%] w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[2px]"
        style={{ background: "linear-gradient(135deg, hsl(195 100% 55%), hsl(270 75% 62%))" }}
        animate={{
          boxShadow: [
            "0 0 28px hsl(195 100% 55% / 0.35), 0 0 48px hsl(270 75% 62% / 0.2)",
            "0 0 42px hsl(195 100% 55% / 0.5), 0 0 64px hsl(270 75% 62% / 0.28)",
            "0 0 28px hsl(195 100% 55% / 0.35), 0 0 48px hsl(270 75% 62% / 0.2)",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div className="h-full w-full rounded-full border border-primary/10 bg-background/20 backdrop-blur-[2px]" />
      </motion.div>

      <motion.div className="absolute left-1/2 top-1/2 z-10 h-[38%] w-[38%] min-h-[120px] min-w-[120px] -translate-x-1/2 -translate-y-1/2">
        <motion.div className="absolute inset-0 rounded-full border-2 border-primary/80 bg-background/40 shadow-[0_0_55px_hsl(var(--primary)/0.5),0_0_90px_hsl(280_70%_55%/0.15),inset_0_0_40px_hsl(var(--primary)/0.12)] backdrop-blur-sm" />
        <motion.div
          className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.12),transparent_70%)]"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute inset-x-0 top-1/2 z-20 flex h-[42%] -translate-y-1/2 items-end justify-center gap-[3px] px-[6%] [mask-image:linear-gradient(90deg,transparent,black_18%,black_82%,transparent)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          {WAVEFORM.map((height, index) => (
            <motion.span
              key={index}
              className={cn(
                "w-[3px] min-w-[2px] max-w-[4px] flex-1 rounded-full",
                index % 4 === 0 ? "bg-sky-400/90" : index % 2 === 0 ? "bg-primary" : "bg-primary/75",
              )}
              style={{ height: `${height}%`, boxShadow: "0 0 10px hsl(var(--primary) / 0.65)" }}
              animate={{ scaleY: [0.55, 1, 0.6] }}
              transition={{
                duration: 1.1 + (index % 7) * 0.08,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.03,
              }}
            />
          ))}
        </motion.div>

        <motion.div className="absolute inset-0 z-30 flex items-center justify-center">
          <span
            className="select-none text-[clamp(3.75rem,13vw,6rem)] font-bold leading-none tracking-tighter text-primary"
            style={{
              textShadow:
                "0 0 24px hsl(var(--primary)), 0 0 48px hsl(var(--primary) / 0.55), 0 0 72px hsl(195 100% 55% / 0.35)",
            }}
          >
            X
          </span>
        </motion.div>
      </motion.div>

      <motion.div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
        {ORBIT_PEOPLE.map((person, index) => {
          const angleDeg = (index / ORBIT_PEOPLE.length) * 360 - 90;

          return (
            <motion.div
              key={`${person.img}-${index}`}
              className="absolute left-1/2 top-1/2"
              style={{
                width: 0,
                height: `${ORBIT_RADIUS_PERCENT}%`,
                transformOrigin: "50% 100%",
                transform: `translate(-50%, -100%) rotate(${angleDeg}deg)`,
              }}
            >
              <motion.div
                className="pointer-events-auto absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.12,
                }}
              >
                <motion.div style={{ transform: `rotate(${-angleDeg}deg)` }}>
                  <motion.div
                    className="relative shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-background/80 shadow-[0_0_20px_hsl(var(--primary)/0.22)]"
                    style={{ width: AVATAR_PX, height: AVATAR_PX }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Image
                      src={`https://i.pravatar.cc/160?img=${person.img}`}
                      alt=""
                      fill
                      sizes={`${AVATAR_PX}px`}
                      className="object-cover object-center"
                      unoptimized
                    />
                    <span
                      className={cn(
                        "absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-background",
                        STATUS_DOT[person.status],
                      )}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        className="absolute inset-x-[12%] bottom-[6%] h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
    </motion.div>
  );
}
