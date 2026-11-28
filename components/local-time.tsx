"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/content";

const format = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: site.timeZone,
  timeZoneName: "short",
});

/** My local time, so you know when to expect a reply. Empty until it runs in the browser. */
export function LocalTime() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(format.format(new Date()));
    tick();
    const timer = setInterval(tick, 15_000);
    return () => clearInterval(timer);
  }, []);

  return time ? <span className="tabular-nums">{time}</span> : null;
}
