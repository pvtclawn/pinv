import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <main className="flex flex-col items-center justify-center gap-8 px-8 text-center">
        <div className="relative">
          <Image
            src="/logo.svg"
            alt="PinV Logo"
            width={260}
            height={260}
            priority
          />
        </div>

        <p className="text-xl font-medium text-gray-600 sm:text-2xl">
          Pinned casts dynamic view
        </p>
      </main>
    </div>
  );
}
