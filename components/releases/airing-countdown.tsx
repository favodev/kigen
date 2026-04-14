"use client";

import { useEffect, useMemo, useState } from "react";

type AiringCountdownProps = {
  airingAtUnix: number | null;
};

function formatRemaining(secondsRemaining: number) {
  const total = Math.max(0, secondsRemaining);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
  };
}

export function AiringCountdown({ airingAtUnix }: AiringCountdownProps) {
  const [now, setNow] = useState<number | null>(null);
  const [localLabel, setLocalLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!airingAtUnix) {
      return undefined;
    }

    setNow(Math.floor(Date.now() / 1000));
    setLocalLabel(
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(airingAtUnix * 1000)),
    );

    const id = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => window.clearInterval(id);
  }, [airingAtUnix]);

  const remaining = useMemo(() => {
    if (!airingAtUnix || now === null) {
      return null;
    }

    return formatRemaining(airingAtUnix - now);
  }, [airingAtUnix, now]);

  if (!airingAtUnix) {
    return <p className="mt-2 text-[11px] uppercase tracking-wider text-slate-500">countdown tbd</p>;
  }

  if (!remaining) {
    return <p className="mt-2 text-[11px] uppercase tracking-wider text-slate-500">calculando countdown...</p>;
  }

  if (now !== null && airingAtUnix <= now) {
    return (
      <div className="mt-2 space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-emerald-300">emitiendo ahora</p>
        {localLabel ? (
          <p className="text-[11px] uppercase tracking-wider text-slate-400">local: {localLabel}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <p className="text-[11px] uppercase tracking-wider text-cyan-300">
        {remaining.days}d {remaining.hours}h {remaining.minutes}m {remaining.seconds}s
      </p>
      {localLabel ? (
        <p className="text-[11px] uppercase tracking-wider text-slate-400">local: {localLabel}</p>
      ) : null}
    </div>
  );
}
