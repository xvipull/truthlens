import TruthLensAnalyzer from "@/components/truthlens-analyzer";

export default function Home() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-6">
        <TruthLensAnalyzer />
      </main>
    </div>
  );
}
