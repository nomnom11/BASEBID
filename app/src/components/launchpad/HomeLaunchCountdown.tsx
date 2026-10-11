
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "basedbid:launch-countdown:v1";
const THREE_HOURS = 3 * 60 * 60 * 1000;

export default function HomeLaunchCountdown() {
  const [remaining, setRemaining] = useState(THREE_HOURS);

  useEffect(() => {
    let endAt = Number(localStorage.getItem(STORAGE_KEY));

    if (!Number.isFinite(endAt) || endAt <= 0) {
      endAt = Date.now() + THREE_HOURS;
      localStorage.setItem(STORAGE_KEY, String(endAt));
    }

    const update = () => {
      setRemaining(Math.max(0, endAt - Date.now()));
    };

    update();

    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const hours = String(
    Math.floor(remaining / 3600000)
  ).padStart(2, "0");

  const minutes = String(
    Math.floor((remaining % 3600000) / 60000)
  ).padStart(2, "0");

  const seconds = String(
    Math.floor((remaining % 60000) / 1000)
  ).padStart(2, "0");

  return (
    <>
      <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-ink">
        {hours}:{minutes}:{seconds}
      </p>
      <p className="mt-1 text-xs text-muted">
        {remaining <= 0
          ? "Timer complete — you can launch manually."
          : "Countdown continues when you refresh the page."}
      </p>
    </>
  );
}