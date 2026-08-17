export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
        Group food compatibility assistant
      </p>
      <h1 className="text-5xl font-semibold tracking-tight text-neutral-950">
        MenuKita
      </h1>
      <p className="max-w-2xl text-lg leading-8 text-neutral-600">
        The shared application foundation is ready. Product flows and visual
        design will be implemented against the typed contracts in{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm text-neutral-800">
          src/lib/schemas
        </code>
        .
      </p>
    </main>
  );
}
