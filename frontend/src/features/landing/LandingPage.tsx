import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  HeartPulse,
  Menu,
  MessageSquare,
  MonitorSmartphone,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  LANDING_COPY,
  LANDING_DOCTORS_ON_DUTY,
  LANDING_FEATURES,
  LANDING_MEDICINES,
  LANDING_NAV_LINKS,
  LANDING_QUEUE_PATIENTS,
  LANDING_SOLUTIONS,
  LANDING_TESTIMONIALS,
} from "../../constants/landing.js";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const goToLogin = () => {
    setIsMenuOpen(false);
    navigate("/login");
  };

  const handleDemoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="landing-page min-h-screen overflow-x-clip bg-[#f5faf8] text-[#171d1c]">
      <header className="sticky top-0 z-50 border-b border-[#bcc9c6]/50 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href="#home"
            className="flex items-center gap-3"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00685f] text-white shadow-sm shadow-[#00685f]/20">
              <HeartPulse className="h-6 w-6" />
            </span>
            <span className="flex shrink-0 flex-col">
              <span className="flex items-center gap-2 whitespace-nowrap text-base font-extrabold tracking-tight text-[#00685f] sm:text-lg">
                {LANDING_COPY.brand.name}
              </span>
              <span className="hidden text-[11px] leading-none text-[#3d4947] md:block">
                {LANDING_COPY.brand.tagline}
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
            {LANDING_NAV_LINKS.map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-sm font-semibold text-[#3d4947] transition-colors hover:text-[#00685f]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <a
              href="https://wa.me/919834007250?text=Hello%20Team%2C%20Can%20you%20please%20share%20the%20plan%20details%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-500/40 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 hover:border-emerald-600 lg:px-3.5"
              title="Chat with us on WhatsApp"
            >
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
            <a
              href="#demo"
              className="whitespace-nowrap rounded-lg border border-[#bcc9c6] bg-white px-3 py-2 text-sm font-semibold text-[#171d1c] transition-colors hover:border-[#00685f] hover:bg-[#f0f5f2] lg:px-4"
            >
              {LANDING_COPY.navigation.demo}
            </a>
            <button
              type="button"
              onClick={goToLogin}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#00685f] px-3 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#00685f]/20 transition-colors hover:bg-[#008378] lg:px-4"
            >
              <ArrowRight className="h-4 w-4" />
              {LANDING_COPY.brand.portal}
            </button>
          </div>

          <button
            type="button"
            aria-label="Toggle navigation"
            className="rounded-lg p-2 text-[#3d4947] hover:bg-[#f0f5f2] sm:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
        {isMenuOpen && (
          <div className="border-t border-[#bcc9c6]/40 bg-white px-4 py-4 sm:hidden">
            <div className="flex flex-col gap-1">
              {LANDING_NAV_LINKS.map(([label, id]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#3d4947] hover:bg-[#f0f5f2]"
                >
                  {label}
                </a>
              ))}
              <a
                href="https://wa.me/919834007250?text=Hello%20Team%2C%20Can%20you%20please%20share%20the%20plan%20details%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
              >
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                Chat on WhatsApp (+91 9834007250)
              </a>
              <button
                type="button"
                onClick={goToLogin}
                className="mt-2 rounded-lg bg-[#00685f] px-3 py-2.5 text-left text-sm font-bold text-white"
              >
                {LANDING_COPY.brand.portal}
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section
          id="home"
          className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-20"
        >
          <div className="landing-grid absolute inset-0 -z-10 opacity-70" />
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#bcc9c6]/70 bg-white px-3.5 py-1.5 text-xs font-bold text-[#00685f] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#6bd8cb]" />
              <Sparkles className="h-3.5 w-3.5" />
              {LANDING_COPY.hero.badge}
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[#171d1c] sm:text-5xl lg:text-6xl">
              {LANDING_COPY.hero.titleBefore}{" "}
              <span className="text-[#00685f] underline decoration-[#6bd8cb] decoration-4 underline-offset-8">
                {LANDING_COPY.hero.titleHighlight}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[#3d4947] sm:text-lg">
              {LANDING_COPY.hero.description}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#demo"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00685f] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#00685f]/20 transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                {LANDING_COPY.hero.demo} <CalendarDays className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={goToLogin}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#bcc9c6] bg-white px-7 py-3.5 text-sm font-bold text-[#171d1c] transition-colors hover:border-[#00685f] hover:bg-[#f0f5f2] sm:w-auto"
              >
                <MonitorSmartphone className="h-4 w-4 text-[#00685f]" />
                {LANDING_COPY.brand.portal}
              </button>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-6xl overflow-hidden rounded-2xl border border-[#bcc9c6] bg-white shadow-[0_24px_60px_rgba(0,72,65,0.14)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#bcc9c6] bg-[#eaefed] px-4 py-3 text-xs text-[#3d4947]">
              <div className="flex items-center gap-2.5 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ba1a1a]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#00685f]" />
                <span className="ml-2">
                  {LANDING_COPY.preview.workspace}
                </span>
              </div>
              <span className="flex items-center gap-1.5 rounded bg-[#89f5e7] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#005049]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00685f]" /> {LANDING_COPY.preview.live}
              </span>
            </div>
            <div className="grid grid-cols-1 divide-y divide-[#bcc9c6] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
              <div className="p-5 lg:col-span-4">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{LANDING_COPY.preview.queueTitle}</h2>
                    <p className="text-xs text-[#3d4947]">
                      {LANDING_COPY.preview.queueSummary}
                    </p>
                  </div>
                  <span className="rounded bg-[#00685f] px-2.5 py-1 text-xs font-bold text-white">
                    {LANDING_COPY.preview.walkIn}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="rounded-lg border-2 border-[#00685f] bg-[#89f5e7]/35 p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00685f] text-sm font-bold text-white">
                        #08
                      </span>
                      <div>
                        <div className="text-sm font-bold">
                          {LANDING_COPY.preview.activePatient}{" "}
                          <span className="font-normal text-[#3d4947]">
                            {LANDING_COPY.preview.activePatientMeta}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#00685f]">
                          {LANDING_COPY.preview.activePatientReason}
                        </div>
                      </div>
                      <span className="ml-auto rounded bg-[#00685f] px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                        {LANDING_COPY.preview.activePatientStatus}
                      </span>
                    </div>
                  </div>
                  {LANDING_QUEUE_PATIENTS.map(([token, name, detail, time]) => (
                    <div
                      key={token}
                      className="flex items-center justify-between rounded-lg border border-[#bcc9c6] p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaefed] text-sm font-bold text-[#3d4947]">
                          {token}
                        </span>
                        <div>
                          <div className="text-sm font-bold">{name}</div>
                          <div className="text-xs text-[#3d4947]">{detail}</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#3d4947]">
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#bcc9c6] pt-3 text-[11px] text-[#3d4947]">
                  <span>
                    {LANDING_COPY.preview.queueUpdates} <b className="text-[#00685f]">{LANDING_COPY.preview.automatic}</b>
                  </span>
                                  </div>
              </div>
              <div className="p-5 lg:col-span-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#00685f]" />
                    <h2 className="text-lg font-bold">
                      {LANDING_COPY.preview.consultationTitle}
                    </h2>
                  </div>
                  <span className="rounded bg-[#eaefed] px-2 py-1 text-[10px] font-bold text-[#3d4947]">
                    {LANDING_COPY.preview.patientId}
                  </span>
                </div>
                <div className="mb-4 grid grid-cols-4 rounded-lg border border-[#bcc9c6] bg-[#f5faf8] p-2 text-center">
                  {LANDING_COPY.preview.vitalValues.map(([label, value]) => (
                    <div key={label}>
                      <span className="block text-[10px] uppercase text-[#3d4947]">{label}</span>
                      <b className={`text-sm ${label === "SpO2" ? "text-[#00685f]" : ""}`}>{value}</b>
                    </div>
                  ))}
                </div>
                <div className="mb-3 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#3d4947]">
                  <span>{LANDING_COPY.preview.medicinesTitle}</span>
                  <span className="text-[#00685f]">{LANDING_COPY.preview.addMedicine}</span>
                </div>
                {LANDING_MEDICINES.map(([name, detail, badge]) => (
                  <div
                    key={name}
                    className="mb-2 flex items-center justify-between rounded-lg border border-[#bcc9c6] bg-[#f5faf8] p-3"
                  >
                    <div>
                      <div className="text-sm font-bold">{name}</div>
                      <div className="text-xs text-[#3d4947]">{detail}</div>
                    </div>
                    <span className="rounded bg-[#89f5e7]/55 px-2 py-1 text-[10px] font-bold text-[#005049]">
                      {badge}
                    </span>
                  </div>
                ))}
                <div className="mt-4 border-t border-[#bcc9c6] pt-3 text-xs font-bold text-[#00685f]">
                  {LANDING_COPY.preview.digitalPrescription}
                </div>
              </div>
              <div className="flex flex-col justify-between bg-[#f5faf8] p-5 lg:col-span-3">
                <div>
                  <h2 className="mb-3 text-lg font-bold">{LANDING_COPY.preview.insightsTitle}</h2>
                  <div className="rounded-xl border border-[#bcc9c6] bg-white p-3.5">
                    <div className="text-xs text-[#3d4947]">
                      {LANDING_COPY.preview.collections}
                    </div>
                    <div className="mt-1 text-3xl font-extrabold">
                      {LANDING_COPY.preview.collectionValue}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-[#00685f]">
                      {LANDING_COPY.preview.billed}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#3d4947]">{LANDING_COPY.preview.upiLabel}</span>
                      <b>{LANDING_COPY.preview.upiValue}</b>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#3d4947]">{LANDING_COPY.preview.cashLabel}</span>
                      <b>{LANDING_COPY.preview.cashValue}</b>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-[#bcc9c6] bg-white p-3 text-xs">
                    <div className="mb-2 font-extrabold uppercase tracking-[0.08em] text-[#3d4947]">
                      {LANDING_COPY.preview.doctorsOnDuty}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span>{LANDING_DOCTORS_ON_DUTY[0][0]}</span>
                        <b className="text-[#00685f]">{LANDING_DOCTORS_ON_DUTY[0][1]}</b>
                      </div>
                      <div className="flex justify-between">
                        <span>{LANDING_DOCTORS_ON_DUTY[1][0]}</span>
                        <b className="text-[#00685f]">{LANDING_DOCTORS_ON_DUTY[1][1]}</b>
                      </div>
                      <div className="flex justify-between text-[#3d4947]">
                        <span>{LANDING_DOCTORS_ON_DUTY[2][0]}</span>
                        <span>{LANDING_DOCTORS_ON_DUTY[2][1]}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 border-t border-[#bcc9c6] pt-3 text-center text-xs font-bold text-[#00685f]">
                  {LANDING_COPY.preview.explore}{" "}
                  <ArrowRight className="inline h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-t border-[#bcc9c6]/50 px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <span className="inline-flex rounded-full bg-[#89f5e7] px-3 py-1 text-xs font-extrabold text-[#005049]">
                {LANDING_COPY.features.eyebrow}
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {LANDING_COPY.features.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#3d4947]">
                {LANDING_COPY.features.description}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {LANDING_FEATURES.map(
                ({ icon: Icon, title, description, points, wide }) => (
                  <article
                    key={title}
                    className={`${wide ? "md:col-span-2" : ""} rounded-xl border border-[#bcc9c6] bg-white p-7 shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-1`}
                  >
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#89f5e7]/55 text-[#00685f]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="mt-3 max-w-2xl leading-7 text-[#3d4947]">
                      {description}
                    </p>
                    <div className="mt-6 grid gap-3 border-t border-[#bcc9c6]/70 pt-5 sm:grid-cols-2">
                      {points.map((point) => (
                        <div
                          key={point}
                          className="flex items-start gap-2 text-sm font-semibold"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00685f]" />
                          {point}
                        </div>
                      ))}
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section
          id="solutions"
          className="bg-[#f0f5f2] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {LANDING_COPY.solutions.title}
              </h2>
              <p className="mt-4 text-[#3d4947]">
                {LANDING_COPY.solutions.description}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {LANDING_SOLUTIONS.map(
                ({ title, description, icon: Icon, points }) => (
                  <article
                    key={title}
                    className="rounded-xl border border-[#bcc9c6] bg-white p-6"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaefed] text-[#00685f]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#3d4947]">
                      {description}
                    </p>
                    <ul className="mt-5 space-y-2 text-sm text-[#3d4947]">
                      {points.map((point) => (
                        <li key={point} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-[#00685f]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section id="about" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex rounded-full bg-[#eaefed] px-3 py-1 text-xs font-extrabold text-[#00685f]">
                {LANDING_COPY.about.eyebrow}
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {LANDING_COPY.about.title}
              </h2>
              <p className="mt-5 text-base leading-7 text-[#3d4947]">
                {LANDING_COPY.about.paragraphs[0]}
              </p>
              <p className="mt-4 text-base leading-7 text-[#3d4947]">
                {LANDING_COPY.about.paragraphs[1]}
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#bcc9c6] pt-6">
                <div>
                  <div className="text-2xl font-extrabold text-[#00685f]">
                    {LANDING_COPY.about.stats[0][0]}
                  </div>
                  <div className="mt-1 text-xs text-[#3d4947]">
                    {LANDING_COPY.about.stats[0][1]}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#00685f]">
                    {LANDING_COPY.about.stats[1][0]}
                  </div>
                  <div className="mt-1 text-xs text-[#3d4947]">
                    {LANDING_COPY.about.stats[1][1]}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#00685f]">
                    {LANDING_COPY.about.stats[2][0]}
                  </div>
                  <div className="mt-1 text-xs text-[#3d4947]">
                    {LANDING_COPY.about.stats[2][1]}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#bcc9c6] bg-[#f5faf8] p-6 shadow-[0_18px_35px_rgba(0,72,65,0.1)] sm:p-8">
              <div className="flex items-center justify-between border-b border-[#bcc9c6] pb-5">
                <div>
                  <h3 className="text-lg font-bold">{LANDING_COPY.about.transformationTitle}</h3>
                  <p className="mt-1 text-xs text-[#3d4947]">
                    {LANDING_COPY.about.transformationSubtitle}
                  </p>
                </div>
                <BarChart3 className="h-7 w-7 text-[#00685f]" />
              </div>
              <div className="space-y-6 pt-6">
                {LANDING_COPY.about.benchmarkLabels.map(([label, value, width]) => (
                  <div key={label}>
                    <div className="mb-2 flex justify-between gap-3 text-xs font-bold">
                      <span>{label}</span>
                      <span className="text-[#00685f]">{value}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#dee4e1]">
                      <div
                        className={`h-full rounded-full bg-[#00685f] ${width}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-3 rounded-xl border border-[#bcc9c6] bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#89f5e7] text-sm font-extrabold text-[#005049]">
                  AK
                </span>
                <div>
                  <p className="text-sm italic text-[#3d4947]">
                    &quot;{LANDING_COPY.about.quote}&quot;
                  </p>
                  <p className="mt-1 text-xs font-bold">
                    {LANDING_COPY.about.quoteBy}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#bcc9c6]/50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="inline-flex rounded-full bg-[#89f5e7] px-3 py-1 text-xs font-extrabold text-[#005049]">
                 {LANDING_COPY.testimonials.eyebrow}
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                 {LANDING_COPY.testimonials.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {LANDING_TESTIMONIALS.map((testimonial) => (
                <article
                  key={testimonial.name}
                  className="rounded-xl border border-[#bcc9c6] bg-white p-7"
                >
                  <div className="mb-5 flex gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Sparkles key={star} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-base italic leading-7 text-[#3d4947]">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-[#bcc9c6]/60 pt-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00685f] text-sm font-bold text-white">
                      {testimonial.initials}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold">{testimonial.name}</h3>
                      <p className="text-xs text-[#3d4947]">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <span className="inline-flex rounded-full bg-[#89f5e7] px-3 py-1 text-xs font-extrabold text-[#005049]">
                {LANDING_COPY.demo.eyebrow}
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {LANDING_COPY.demo.title}
              </h2>
              <p className="mt-5 leading-7 text-[#3d4947]">
                {LANDING_COPY.demo.description}
              </p>
              <div className="mt-8 space-y-4 border-t border-[#bcc9c6] pt-6 text-sm text-[#3d4947]">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-[#00685f]" />{" "}
                  {LANDING_COPY.demo.benefits[0]}
                </div>
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-[#00685f]" /> {LANDING_COPY.demo.benefits[1]}
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#00685f]" /> {LANDING_COPY.demo.benefits[2]}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <form
                onSubmit={handleDemoSubmit}
                className="rounded-2xl border border-[#bcc9c6] bg-white p-6 shadow-[0_16px_30px_rgba(0,72,65,0.08)] sm:p-8"
              >
                <h3 className="text-2xl font-bold">{LANDING_COPY.demo.titleForm}</h3>
                <p className="mt-2 text-sm text-[#3d4947]">
                  {LANDING_COPY.demo.formDescription}
                </p>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#3d4947]">
                    {LANDING_COPY.demo.nameLabel}
                    <input
                      required
                      className="mt-1.5 w-full rounded-lg border border-[#bcc9c6] bg-[#f5faf8] px-3.5 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#89f5e7]"
                      placeholder={LANDING_COPY.demo.namePlaceholder}
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#3d4947]">
                    {LANDING_COPY.demo.phoneLabel}
                    <input
                      required
                      type="tel"
                      className="mt-1.5 w-full rounded-lg border border-[#bcc9c6] bg-[#f5faf8] px-3.5 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#89f5e7]"
                      placeholder={LANDING_COPY.demo.phonePlaceholder}
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#3d4947]">
                    {LANDING_COPY.demo.clinicTypeLabel}
                    <select className="mt-1.5 w-full rounded-lg border border-[#bcc9c6] bg-[#f5faf8] px-3.5 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#89f5e7]">
                      {LANDING_COPY.demo.clinicTypes.map((clinicType) => <option key={clinicType}>{clinicType}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#3d4947]">
                    {LANDING_COPY.demo.cityLabel}
                    <input
                      required
                      className="mt-1.5 w-full rounded-lg border border-[#bcc9c6] bg-[#f5faf8] px-3.5 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#89f5e7]"
                      placeholder={LANDING_COPY.demo.cityPlaceholder}
                    />
                  </label>
                </div>
                {isSubmitted ? (
                  <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#6bd8cb] bg-[#f0f5f2] p-4 text-sm text-[#005049]">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>
                      {LANDING_COPY.demo.confirmation}
                    </span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00685f] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#008378]"
                  >
                    {LANDING_COPY.demo.submit} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <p className="mt-3 text-center text-[11px] text-[#3d4947]">
                  {LANDING_COPY.demo.disclaimer}
                </p>
              </form>
            </div>
          </div>
        </section>

        <section className="border-y border-[#bcc9c6]/60 bg-[#eaefed] px-4 py-16 text-center sm:px-6 lg:px-8">
          <HeartPulse className="mx-auto h-10 w-10 rounded-xl bg-[#00685f] p-2 text-white" />
          <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">
            {LANDING_COPY.portal.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#3d4947]">
            {LANDING_COPY.portal.description}
          </p>
          <button
            type="button"
            onClick={goToLogin}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#00685f] px-6 py-3 text-sm font-bold text-white hover:bg-[#008378]"
          >
            {LANDING_COPY.portal.action} <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </main>

      <footer className="bg-[#dee4e1] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 border-b border-[#6d7a77]/40 pb-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-lg font-extrabold text-[#00685f]">
              <HeartPulse className="h-7 w-7 rounded-lg bg-[#00685f] p-1 text-white" />
              {LANDING_COPY.brand.name}
            </div>
            <p className="mt-4 text-sm leading-6 text-[#3d4947]">
              {LANDING_COPY.footer.description}
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#3d4947]">
              <ShieldCheck className="h-4 w-4 text-[#00685f]" /> {LANDING_COPY.footer.privacy}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.08em]">
              {LANDING_COPY.footer.solutions}
            </h3>
            <div className="mt-4 space-y-2 text-sm text-[#3d4947]">
              <a href="#features" className="block hover:text-[#00685f]">
                {LANDING_COPY.footer.patientQueue}
              </a>
              <a href="#features" className="block hover:text-[#00685f]">
                {LANDING_COPY.footer.consultations}
              </a>
              <a href="#features" className="block hover:text-[#00685f]">
                {LANDING_COPY.footer.billing}
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.08em]">
              {LANDING_COPY.footer.explore}
            </h3>
            <div className="mt-4 space-y-2 text-sm text-[#3d4947]">
              <a href="#about" className="block hover:text-[#00685f]">
                {LANDING_COPY.footer.about}
              </a>
              <a href="#demo" className="block hover:text-[#00685f]">
                {LANDING_COPY.footer.demo}
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.08em]">
              {LANDING_COPY.footer.contact}
            </h3>
            <div className="mt-4 space-y-2 text-sm text-[#3d4947]">
              <p>Email: <a href="mailto:info@medinovel.com" className="text-[#00685f] hover:underline">info@medinovel.com</a></p>
              <p>Phone: +91 9923569431 / +91 7875433447</p>
              <p>WhatsApp: <a href="https://wa.me/919834007250?text=Hello%20Team%2C%20Can%20you%20please%20share%20the%20plan%20details%3F" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">+91 9834007250</a></p>
              <p>{LANDING_COPY.footer.supportHours}</p>
              <button
                type="button"
                onClick={goToLogin}
                className="font-bold text-[#00685f] hover:underline"
              >
                {LANDING_COPY.footer.login}
              </button>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 pt-6 text-xs text-[#3d4947] sm:flex-row sm:items-center sm:justify-between">
          <span>{LANDING_COPY.footer.copyright}</span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#00685f]" /> {LANDING_COPY.footer.secure}
          </span>
        </div>
      </footer>

      {/* Floating WhatsApp CTA Button */}
      <a
        href="https://wa.me/919834007250?text=Hello%20Team%2C%20Can%20you%20please%20share%20the%20plan%20details%3F"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-900/30 transition-all hover:scale-105 hover:bg-[#20ba5a] active:scale-95"
        aria-label="Chat with MediNovel Team on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <MessageSquare className="h-5 w-5 fill-white" />
        <span className="hidden sm:inline">WhatsApp Us</span>
      </a>
    </div>
  );
};
