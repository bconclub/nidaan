export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {/* Hero */}
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-clinical-900">
          Nidaan <span className="text-medical">AI</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Multilingual, voice-first health triage for rural India — powered by
          AI, delivered over WhatsApp.
        </p>
      </div>

      {/* Feature cards */}
      <div className="mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title="Voice-First"
          description="Patients describe symptoms by voice in their own language. Sarvam AI handles STT, TTS, and translation across 10+ Indian languages."
        />
        <FeatureCard
          title="Clinical Triage"
          description="Structured symptom analysis with red-flag detection, severity scoring, and specialty routing powered by Claude."
        />
        <FeatureCard
          title="Facility Finder"
          description="Connects patients to the nearest appropriate health facility using ABDM's Health Facility Registry."
        />
      </div>

      {/* CTA */}
      <div className="mt-16">
        <a
          href="/dashboard"
          className="rounded-lg bg-medical px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-medical-dark transition-colors"
        >
          Open Dashboard
        </a>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-clinical-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-clinical-800">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
