import Image from "next/image";

export default function Home() {
  return (
    <div className="w-full h-full p-32 flex justify-center">
      <div className="w-full max-w-4xl space-y-4">
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
        <hr className="border-t border-t-gray-500" />
      </div>
    </div>
  );
}
