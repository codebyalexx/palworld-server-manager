"use server";

import { getServer } from "@/lib/server";

export async function getServerStatus() {
  return (await getServer()).getStatus();
}
