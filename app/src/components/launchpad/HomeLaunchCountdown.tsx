
"use client";

import { useEffect, useState } from "react";

const THREE_HOURS = 3 * 60 * 60 * 1000;

export default function HomeLaunchCountdown() {
  const [remaining, setRemaining] = useState(THREE_HOURS);

  useEffect(() => {
  let interval: number | undefined;

  async function loadCountdown() {
    const res = await fetch("/api/countdown");
    const data = await res.json();

    const endAt = new Date(data.endsAt).getTime();

    const update = () => {
      setRemaining(Math.max(0, endAt - Date.now()));
    };

    update();

    interval = window.setInterval(update, 1000);
  }

  loadCountdown();

  return () => {
    if (interval) {
      window.clearInterval(interval);
    }
  };
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