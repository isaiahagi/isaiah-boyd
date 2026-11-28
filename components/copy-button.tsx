"use client";

import { Check, Copy, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const states = {
  idle: { Icon: Copy, message: "" },
  copied: { Icon: Check, message: "Copied" },
  failed: { Icon: X, message: "Copy failed. Select the text instead." },
};

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState<keyof typeof states>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 1800);
    return () => clearTimeout(timer);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  const { Icon, message } = states[status];

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={message || label}
      className="relative grid size-10 shrink-0 cursor-pointer place-items-center text-faint transition-colors hover:text-fg"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.16 }}
        >
          <Icon aria-hidden strokeWidth={1.5} className="size-4" />
        </motion.span>
      </AnimatePresence>
      <span role="status" className="sr-only">
        {message}
      </span>
    </button>
  );
}
