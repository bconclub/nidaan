"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Intersection Observer hook for scroll animations                   */
/* ------------------------------------------------------------------ */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    const children = el.querySelectorAll(".animate-on-scroll");
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ------------------------------------------------------------------ */
/*  Animated counter component                                         */
/* ------------------------------------------------------------------ */
function AnimatedStat({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated.current) {
          animated.current = true;
          const numericPart = parseInt(value.replace(/[^0-9]/g, ""));
          const duration = 1500;
          const startTime = performance.now();

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * numericPart);
            setDisplay(current.toLocaleString());
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  SVG Icons (inline, no external deps)                               */
/* ------------------------------------------------------------------ */
function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function BrainIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.58.67 3 1.74 4.01L12 18l6.26-6.49A5.49 5.49 0 0 0 20 7.5 5.5 5.5 0 0 0 14.5 2c-1.33 0-2.56.47-3.5 1.26A5.48 5.48 0 0 0 9.5 2z" />
      <path d="M12 18v4" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="16" cy="8" r="1" fill="currentColor" />
      <path d="M9 11s1.5 2 3 2 3-2 3-2" />
    </svg>
  );
}

function HospitalIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-4h6v4" />
      <path d="M10 10h4" />
      <path d="M12 8v4" />
    </svg>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function HeartPulseIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Landing Page                                                  */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  const heroRef = useScrollReveal();
  const howRef = useScrollReveal();
  const problemRef = useScrollReveal();
  const diffRef = useScrollReveal();
  const demoRef = useScrollReveal();
  const builtRef = useScrollReveal();
  const techRef = useScrollReveal();

  return (
    <>
      {/* ============================================================ */}
      {/*  SECTION 1 — HERO                                            */}
      {/* ============================================================ */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24"
      >
        {/* Background gradient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#0FCEAB] opacity-[0.04] blur-[120px]" />
          <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-[#0FCEAB] opacity-[0.03] blur-[100px]" />
        </div>

        <div className="animate-on-scroll relative z-10 max-w-3xl text-center">
          {/* Logo mark */}
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#1E293B] bg-[#1E293B]/60">
            <HeartPulseIcon className="h-8 w-8 text-[#0FCEAB]" />
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-[#F8FAFC] sm:text-7xl">
            Nidaan <span className="text-[#0FCEAB]">AI</span>
          </h1>

          <p className="mt-4 text-xl font-medium text-[#0FCEAB]/80 sm:text-2xl">
            Understand first. Act right.
          </p>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#94A3B8] sm:text-lg">
            Speak your symptoms in any Indian language. Get instant clinical
            triage. Find the nearest doctor. All on WhatsApp.
          </p>

          {/* CTA with pulse ring */}
          <div className="relative mt-10 inline-flex items-center justify-center">
            {/* Pulse rings */}
            <span className="absolute h-14 w-56 rounded-full bg-[#0FCEAB]/20 animate-pulse-ring" />
            <span className="absolute h-14 w-56 rounded-full bg-[#0FCEAB]/20 animate-pulse-ring-delay" />
            <a
              href="https://wa.me/916360079756"
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex items-center gap-2 rounded-full bg-[#0FCEAB] px-8 py-3.5 text-base font-semibold text-[#0A0F1C] shadow-lg shadow-[#0FCEAB]/20 transition-all hover:bg-[#0BA88A] hover:shadow-[#0FCEAB]/30"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Try on WhatsApp
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          {/* Badge */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1E293B] bg-[#1E293B]/50 px-4 py-1.5 text-xs font-medium text-[#94A3B8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0FCEAB] animate-pulse" />
              Powered by Sarvam Bulbul V3
            </span>
            <p className="text-xs text-[#94A3B8]/60">
              Supports Hindi, Kannada, Tamil, Telugu, Bengali, Malayalam + 5 more
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="h-6 w-6 text-[#94A3B8]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
          </svg>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 2 — HOW IT WORKS                                    */}
      {/* ============================================================ */}
      <section ref={howRef} className="relative px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="animate-on-scroll text-center">
            <h2 className="text-3xl font-bold text-[#F8FAFC] sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-[#94A3B8]">Three steps. One voice note. Real care.</p>
          </div>

          <div className="animate-on-scroll mt-16 grid gap-8 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="group relative flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#1E293B] bg-[#1E293B]/60 transition-colors group-hover:border-[#0FCEAB]/30">
                <MicIcon className="h-9 w-9 text-[#0FCEAB]" />
              </div>
              <div className="mt-1 text-sm font-bold text-[#0FCEAB]">Step 1</div>
              <h3 className="mt-2 text-xl font-semibold text-[#F8FAFC]">Speak</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                Send a voice note describing your symptoms in your language
              </p>
              {/* Connector arrow (desktop only) */}
              <div className="absolute -right-4 top-10 hidden text-[#1E293B] sm:block">
                <svg className="h-6 w-8" fill="none" viewBox="0 0 32 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h20m0 0l-6-6m6 6l-6 6" />
                </svg>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#1E293B] bg-[#1E293B]/60 transition-colors group-hover:border-[#0FCEAB]/30">
                <BrainIcon className="h-9 w-9 text-[#0FCEAB]" />
              </div>
              <div className="mt-1 text-sm font-bold text-[#0FCEAB]">Step 2</div>
              <h3 className="mt-2 text-xl font-semibold text-[#F8FAFC]">Understand</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                AI analyzes like a world-class diagnostician — asks follow-ups, probes deeper
              </p>
              <div className="absolute -right-4 top-10 hidden text-[#1E293B] sm:block">
                <svg className="h-6 w-8" fill="none" viewBox="0 0 32 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h20m0 0l-6-6m6 6l-6 6" />
                </svg>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#1E293B] bg-[#1E293B]/60 transition-colors group-hover:border-[#0FCEAB]/30">
                <HospitalIcon className="h-9 w-9 text-[#0FCEAB]" />
              </div>
              <div className="mt-1 text-sm font-bold text-[#0FCEAB]">Step 3</div>
              <h3 className="mt-2 text-xl font-semibold text-[#F8FAFC]">Act</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                Get severity assessment, recommended action, and nearest facility
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 3 — THE PROBLEM                                     */}
      {/* ============================================================ */}
      <section ref={problemRef} className="relative px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-[#EF4444] opacity-[0.03] blur-[100px]" />
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="animate-on-scroll text-center">
            <h2 className="text-3xl font-bold leading-tight text-[#F8FAFC] sm:text-4xl md:text-5xl">
              900 million Indians can&apos;t describe
              <br className="hidden sm:block" /> their symptoms in English.
            </h2>
          </div>

          <div className="animate-on-scroll mt-14 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#EF4444]/20 bg-[#1E293B]/60 p-8 text-center">
              <div className="text-4xl font-bold text-[#EF4444] sm:text-5xl">
                <AnimatedStat value="70" suffix="%" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
                of rural Indians are misdiagnosed or never diagnosed
              </p>
            </div>
            <div className="rounded-2xl border border-[#F59E0B]/20 bg-[#1E293B]/60 p-8 text-center">
              <div className="text-4xl font-bold text-[#F59E0B] sm:text-5xl">
                1:<AnimatedStat value="1500" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
                doctor-to-patient ratio in rural India
              </p>
            </div>
            <div className="rounded-2xl border border-[#F59E0B]/20 bg-[#1E293B]/60 p-8 text-center">
              <div className="text-4xl font-bold text-[#F59E0B] sm:text-5xl">
                <AnimatedStat value="85" suffix="%" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
                of Indians don&apos;t speak English fluently
              </p>
            </div>
          </div>

          <div className="animate-on-scroll mt-10 text-center">
            <p className="mx-auto max-w-2xl text-base text-[#94A3B8]">
              Nidaan bridges the gap between patients and healthcare —{" "}
              <span className="text-[#0FCEAB]">in their mother tongue.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 4 — WHAT MAKES NIDAAN DIFFERENT                     */}
      {/* ============================================================ */}
      <section ref={diffRef} className="relative px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="animate-on-scroll text-center">
            <h2 className="text-3xl font-bold text-[#F8FAFC] sm:text-4xl">
              What makes Nidaan different
            </h2>
          </div>

          <div className="animate-on-scroll mt-14 grid gap-6 sm:grid-cols-2">
            <DifferentiatorCard
              icon={<MicIcon className="h-6 w-6 text-[#0FCEAB]" />}
              title="Voice First"
              description="Not a chatbot. A voice consultation. Speak naturally."
            />
            <DifferentiatorCard
              icon={
                <svg className="h-6 w-6 text-[#0FCEAB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
              title="Probes Like a Doctor"
              description="Doesn't rush to diagnose. Asks the right follow-up questions."
            />
            <DifferentiatorCard
              icon={
                <svg className="h-6 w-6 text-[#0FCEAB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 10h.01" />
                  <path d="M12 10h.01" />
                  <path d="M16 10h.01" />
                </svg>
              }
              title="10+ Indian Languages"
              description="Powered by Sarvam AI's Indic models. Native understanding."
            />
            <DifferentiatorCard
              icon={<HospitalIcon className="h-6 w-6 text-[#0FCEAB]" />}
              title="Routes to Real Care"
              description="Connects you to the nearest verified doctor or hospital."
            />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 5 — DEMO / HOW IT SOUNDS                           */}
      {/* ============================================================ */}
      <section ref={demoRef} className="relative px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-[#0FCEAB] opacity-[0.03] blur-[100px]" />
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="animate-on-scroll text-center">
            <h2 className="text-3xl font-bold text-[#F8FAFC] sm:text-4xl">
              Hear Nidaan in action
            </h2>
            <p className="mt-3 text-[#94A3B8]">A real conversation, in Hindi</p>
          </div>

          <div className="animate-on-scroll mt-12 space-y-4">
            {/* Mock conversation */}
            <ChatBubble
              sender="patient"
              text="Mujhe 3 din se bukhar aa raha hai"
              label="Patient (Hindi)"
            />
            <ChatBubble
              sender="nidaan"
              text="Bukhar ke saath koi aur symptoms hain? Jaise sir dard, body pain, ya khaansi?"
              label="Nidaan AI"
            />
            <ChatBubble
              sender="patient"
              text="Haan body pain bhi hai"
              label="Patient"
            />
            <ChatBubble
              sender="nidaan"
              text="Urgent: Viral fever ke lakshan hain. Paracetamol le sakte hain. Agar 2 din mein theek nahi hota toh General Physician se milein."
              label="Nidaan AI"
              severity="warning"
            />
          </div>

          {/* Waveform visual */}
          <div className="animate-on-scroll mt-10 flex items-center justify-center gap-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-[#0FCEAB]/30"
                style={{
                  height: `${12 + Math.sin(i * 0.5) * 16 + Math.random() * 10}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 6 — BUILT FOR                                       */}
      {/* ============================================================ */}
      <section ref={builtRef} className="relative px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="animate-on-scroll text-center">
            <h2 className="text-3xl font-bold text-[#F8FAFC] sm:text-4xl">
              Built for
            </h2>
          </div>

          <div className="animate-on-scroll mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <AudienceCard icon="🏥" title="ASHA Workers" />
            <AudienceCard icon="👨‍⚕️" title="PHC Doctors" />
            <AudienceCard icon="🧑‍🌾" title="Rural Patients" />
            <AudienceCard icon="🏛️" title="State Health Depts" />
          </div>

          <div className="animate-on-scroll mt-8 text-center">
            <p className="text-sm text-[#94A3B8]">
              From village clinics to district hospitals — Nidaan works everywhere WhatsApp does.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 7 — TECH STACK                                      */}
      {/* ============================================================ */}
      <section ref={techRef} className="relative border-t border-[#1E293B] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="animate-on-scroll text-center">
            <p className="mb-6 text-xs font-medium uppercase tracking-widest text-[#94A3B8]/60">
              Powered by
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              <TechBadge name="Sarvam AI" />
              <TechBadge name="Bulbul V3" />
              <TechBadge name="Claude AI" />
              <TechBadge name="ABDM Ready" />
              <TechBadge name="WhatsApp" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                      */}
      {/* ============================================================ */}
      <footer className="border-t border-[#1E293B] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-2">
              <HeartPulseIcon className="h-5 w-5 text-[#0FCEAB]" />
              <span className="text-lg font-semibold text-[#F8FAFC]">
                Nidaan AI
              </span>
            </div>

            <p className="text-sm text-[#94A3B8]">
              An INDAI Frontiers Research Lab Project
            </p>

            <div className="flex items-center gap-6 text-sm text-[#94A3B8]">
              <a href="#" className="transition-colors hover:text-[#0FCEAB]">About</a>
              <a href="#" className="transition-colors hover:text-[#0FCEAB]">Contact</a>
              <a href="#" className="transition-colors hover:text-[#0FCEAB]">Privacy</a>
            </div>

            <p className="text-sm font-medium text-[#F8FAFC]">
              Built for India. Built in India. 🇮🇳
            </p>

            <p className="max-w-md text-xs leading-relaxed text-[#94A3B8]/50">
              Nidaan AI provides health information only. Always consult a real doctor.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function DifferentiatorCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#1E293B] bg-[#1E293B]/40 p-8 transition-all hover:border-[#0FCEAB]/20 hover:bg-[#1E293B]/60">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#1E293B] bg-[#0A0F1C]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#F8FAFC]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">{description}</p>
    </div>
  );
}

function ChatBubble({
  sender,
  text,
  label,
  severity,
}: {
  sender: "patient" | "nidaan";
  text: string;
  label: string;
  severity?: "warning" | "emergency" | "routine";
}) {
  const isPatient = sender === "patient";
  const severityColors = {
    warning: "border-[#F59E0B]/30 bg-[#F59E0B]/5",
    emergency: "border-[#EF4444]/30 bg-[#EF4444]/5",
    routine: "border-[#10B981]/30 bg-[#10B981]/5",
  };
  const severityIcons = {
    warning: "🟠",
    emergency: "🔴",
    routine: "🟢",
  };

  return (
    <div className={`flex ${isPatient ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] sm:max-w-[75%]`}>
        <p className={`mb-1 text-xs font-medium ${isPatient ? "text-right text-[#94A3B8]/60" : "text-[#0FCEAB]/60"}`}>
          {label}
        </p>
        <div
          className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
            isPatient
              ? "rounded-br-md bg-[#1E293B] text-[#F8FAFC]"
              : severity
              ? `rounded-bl-md border ${severityColors[severity]} text-[#F8FAFC]`
              : "rounded-bl-md border border-[#0FCEAB]/20 bg-[#0FCEAB]/5 text-[#F8FAFC]"
          }`}
        >
          {severity && (
            <span className="mr-1">{severityIcons[severity]}</span>
          )}
          {text}
        </div>
      </div>
    </div>
  );
}

function AudienceCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#1E293B] bg-[#1E293B]/40 p-6 text-center transition-all hover:border-[#0FCEAB]/20">
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-medium text-[#F8FAFC]">{title}</span>
    </div>
  );
}

function TechBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#1E293B] bg-[#1E293B]/40 px-4 py-2 text-sm font-medium text-[#94A3B8] transition-colors hover:border-[#0FCEAB]/20 hover:text-[#0FCEAB]">
      {name}
    </span>
  );
}
