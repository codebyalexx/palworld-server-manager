"use server";

import { getServer } from "@/lib/server";

export async function startServer() {
  (await getServer()).runServer();
}

export async function stopServer() {
  (await getServer()).stopServer();
}
