"use client";

import { useEffect, useState } from "react";
import { discord } from "@/lib/content";

type LanyardUser = {
  username: string;
  global_name: string | null;
  avatar: string | null;
  avatar_decoration_data: { asset: string } | null;
};

type LanyardResponse = {
  success: boolean;
  data?: { discord_user: LanyardUser; discord_status: "online" | "idle" | "dnd" | "offline" };
};

const statusText = { online: "online", idle: "idle", dnd: "do not disturb", offline: "offline" };

const cdn = "https://cdn.discordapp.com";

export function DiscordProfile() {
  const [data, setData] = useState<LanyardResponse["data"]>();

  useEffect(() => {
    const load = () =>
      fetch(`https://api.lanyard.rest/v1/users/${discord.id}`)
        .then((res) => res.json() as Promise<LanyardResponse>)
        .then((body) => body.success && setData(body.data))
        .catch(() => {}); // keep showing the saved profile

    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  const user = data?.discord_user;
  const username = user?.username ?? discord.username;
  const avatar = user ? user.avatar : discord.avatar;
  // null means the decoration was taken off, so don't fall back to the saved one
  const decoration = user ? user.avatar_decoration_data?.asset : discord.decoration;

  return (
    <div className="my-6 flex items-center gap-4">
      {/* Discord draws decorations at 1.2x the avatar, centered on it */}
      <div className="relative m-2 size-20 shrink-0">
        <img
          src={avatar ? `${cdn}/avatars/${discord.id}/${avatar}.png?size=160` : `${cdn}/embed/avatars/0.png`}
          alt="My Discord avatar"
          width={80}
          height={80}
          className="rounded-full"
        />
        {decoration && (
          <img
            src={`${cdn}/avatar-decoration-presets/${decoration}.png?size=240&passthrough=true`}
            alt=""
            width={96}
            height={96}
            className="pointer-events-none absolute -top-2 -left-2 size-24 max-w-none"
          />
        )}
      </div>
      <div>
        <b>{user?.global_name ?? discord.displayName}</b>
        <br />
        {username} on Discord
        {data && <> ({statusText[data.discord_status]})</>}
      </div>
    </div>
  );
}
