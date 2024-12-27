import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sendDiscordMsg(message: string) {
  fetch(
    "https://discord.com/api/webhooks/1322344934602178652/vEWhBUHeSsQ83uxMOWmzC-A_40ryw2W6Dcz8fJZBS54388qdY6Pzo9h4LRI1rLyKXwlG",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
      }),
    }
  );
}
