import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { PlayIcon, RotateCcwIcon, SquareIcon } from "lucide-react";
import Image from "next/image";

export default function Home() {
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
          <div className="grid grid-cols-3 gap-4">
            <Button variant={"outline"} className="flex items-center gap-2">
              <PlayIcon /> Start
            </Button>
            <Button
              variant={"outline"}
              className="flex items-center gap-2"
              disabled
            >
              <SquareIcon />
              Stop
            </Button>
            <Button
              variant={"outline"}
              className="flex items-center gap-2"
              disabled
            >
              <RotateCcwIcon />
              Restart
            </Button>
          </div>
          <p className="font-thin text-sm text-muted-foreground">
            The server is offline.
          </p>
        </div>
      </div>
    </div>
  );
}
