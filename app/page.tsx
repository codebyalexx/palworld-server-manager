"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { startServer, stopServer } from "@/server/actions/server.action";
import { getServerStatus } from "@/server/queries/server.query";
import { PlayIcon, SquareIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("fetching");

  useEffect(() => {
    const loop = setInterval(() => {
      getServerStatus().then((status) => {
        setStatus(status);
      });
    }, 500);

    return () => {
      clearInterval(loop);
    };
  }, []);

  return (
    <div className="w-full h-full p-32 flex justify-center">
      <div className="w-full max-w-4xl space-y-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-4">
            <Image
              width={64}
              height={64}
              src={"/icon.png"}
              alt="Application icon"
              className="rounded-lg"
            />
            Palworld Server Manager
          </h1>
          <ModeToggle />
        </div>
        <div className="bg-secondary/50 rounded-lg p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={"outline"}
              className="flex items-center gap-2"
              disabled={status === "online"}
              onClick={async () => {
                startServer();
              }}
            >
              <PlayIcon /> Start
            </Button>
            <Button
              variant={"outline"}
              className="flex items-center gap-2"
              disabled={status === "offline"}
              onClick={async () => {
                stopServer();
              }}
            >
              <SquareIcon />
              Stop
            </Button>
          </div>
          <p className="font-thin text-sm text-muted-foreground">
            The server is {status}.
          </p>
        </div>
      </div>
    </div>
  );
}
