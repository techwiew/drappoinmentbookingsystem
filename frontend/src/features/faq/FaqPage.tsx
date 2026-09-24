import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  ChevronDown,
  X,
  MessageSquare,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';

export const FaqPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const faqs = [
    {
      question: "What is MediNovel?",
      answer: "MediNovel is a subscription-based multi-tenant doctor clinic management SaaS platform designed to streamline clinic operations, from appointment scheduling to billing and patient management.",
    },
    {
      question: "How does MediNovel ensure data security?",
      answer: "MediNovel uses industry-standard encryption for data at rest and in transit. We implement role-based access control, regular security audits, and comply with data protection regulations to ensure your clinic's data is secure.",
    },
    {
      question: "Can I use MediNovel for multiple clinics?",
      answer: "Yes, MediNovel supports multi-tenant architecture, allowing you to manage multiple clinics from a single account. Each clinic's data is isolated and secure.",
    },
    {
      question: "What kind of support does MediNovel offer?",
      answer: "We provide 24/7 email support, live chat during business hours, and a comprehensive knowledge base. Premium plans include dedicated account managers and phone support.",
    },
    {
      question: "Is MediNovel compatible with existing medical devices?",
      answer: "MediNovel is designed to work with standard clinic equipment. We support integration with various devices through APIs, and our team can assist with specific integration requirements.",
    },
    {
      question: "How does the pricing work?",
      answer: "MediNovel offers flexible subscription plans based on the number of doctors and clinics. We have a free trial period, and you can upgrade or downgrade your plan at any time.",
    },
    {
      question: "Can I migrate my existing data to MediNovel?",
      answer: "Yes, we provide data migration assistance to help you transfer patient records, appointment history, and other data from your existing system to MediNovel.",
    },
    {
      question: "What training is available for my team?",
      answer: "We offer comprehensive onboarding including video tutorials, documentation, and live training sessions. Our support team is available to help your team get up to speed quickly.",
    },
  ];

  return (
    <div className="faq-page min-h-screen bg-[#f5faf8]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#bcc9c6]/50 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <a
              href="#home"
              onClick={() => setIsMenuOpen(false)}
            >
              <img src="/Medinovel_logo.png" alt="MediNovel" className="brand-logo h-11 w-11 rounded-xl object-contain" />
              <span className="flex shrink-0 flex-col">
                <span className="flex items-center gap-2 whitespace-nowrap text-base font-extrabold tracking-tight text-[#00685f] sm:text-lg">
                  MediNovel
                </span>
                <span className="hidden text-[11px] leading-none text-[#3d4947] md:block">
                  A calmer operating system for care
                </span>
              </span>
            </a>
            <a
              href="https://www.nativenodes.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-[#00685f] hover:text-[#008378]"
            >
              NativeNode
            </a>
          </div>

          <div className="hidden items-center gap-5 lg:flex xl:gap-7">
            <a
              href="#features"
              className="text-sm font-semibold text-[#3d4947] transition-colors hover:text-[#00685f]"
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/features');
              }}
            >
              Features
            </a>
            <a
              href="#solutions"
              className="text-sm font-semibold text-[#3d4947] transition-colors hover:text-[#00685f]"
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/solutions');
              }}
            >
              Solutions
            </a>
            <a
              href="#about"
              className="text-sm font-semibold text-[#3d4947] transition-colors hover:text-[#00685f]"
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/about');
              }}
            >
              About
            </a>
            <a
              href="#contact"
              className="text-sm font-semibold text-[#3d4947] transition-colors hover:text-[#00685f]"
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/contact');
              }}
            >
              Contact
            </a>
          </div>

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
              href="/login"
              className="whitespace-nowrap rounded-lg border border-[#bcc9c6] bg-white px-3 py-2 text-sm font-semibold text-[#171d1c] transition-colors hover:border-[#00685f] hover:bg-[#f0f5f2] lg:px-4"
            >
              Launch Clinic Portal
            </a>
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
              <a
                href="#features"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/features');
                }}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#3d4947] hover:bg-[#f0f5f2]"
              >
                Features
              </a>
              <a
                href="#solutions"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/solutions');
                }}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#3d4947] hover:bg-[#f0f5f2]"
              >
                Solutions
              </a>
              <a
                href="#about"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/about');
                }}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#3d4947] hover:bg-[#f0f5f2]"
              >
                About
              </a>
              <a
                href="#contact"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/contact');
                }}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#3d4947] hover:bg-[#f0f5f2]"
              >
                Contact
              </a>
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
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/login');
                }}
                className="mt-2 rounded-lg bg-[#00685f] px-3 py-2.5 text-left text-sm font-bold text-white"
              >
                Launch Clinic Portal
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="px-4 pt-20 sm:px-6 lg:px-8 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span className="inline-flex rounded-full bg-[#89f5e7] px-3 py-1 text-xs font-extrabold text-[#005049]">
              Frequently Asked Questions
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Get answers to common questions about MediNovel
            </h2>
            <p className="mt-4 text-base leading-7 text-[#3d4947]">
              Find quick answers to help you understand how MediNovel works for your clinic.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map(({ question, answer }, index) => (
              <Card key={index} className="border-[#bcc9c6] bg-white">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-3 w-full">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="w-full text-left flex items-center justify-between"
                      onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                    >
                      <div className="flex-1 text-left">
                        <h3 className="text-xl font-bold text-[#171d1c]">{question}</h3>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${activeIndex === index ? 'rotate-180' : ''}`}
                      />
                    </Button>
                  </div>
                </div>
                {activeIndex === index && (
                  <div className="px-6 pt-4 pb-6 text-base leading-7 text-[#3d4947] border-t border-[#bcc9c6]/50">
                    <p>{answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* JSON-LD Schema for FAQ - Fixed */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map(({ question, answer }) => ({
                "@type": "Question",
                "name": question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": answer,
                },
              })),
            })
          }</script>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#dee4e1] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 border-b border-[#6d7a77]/40 pb-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-lg font-extrabold text-[#00685f]">
              <HeartPulse className="h-7 w-7 rounded-lg bg-[#00685f] p-1 text-white" />
              MediNovel
            </div>
            <p className="mt-4 text-sm leading-6 text-[#3d4947]">
              A practical clinic management workspace for better queues, clearer consultations, and calmer days.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#3d4947]">
              <ShieldCheck className="h-4 w-4 text-[#00685f]" /> Built with privacy in mind
            </div>
            <a
              href="https://www.nativenodes.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-sm font-semibold text-[#00685f] hover:text-[#008378]"
            >
              NativeNode
            </a>
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.08em]">
              Solutions
            </h3>
            <div className="mt-4 space-y-2 text-sm text-[#3d4947]">
              <a href="#features" className="block hover:text-[#00685f]">
                Patient queue
              </a>
              <a href="#features" className="block hover:text-[#00685f]">
                Consultations
              </a>
              <a href="#features" className="block hover:text-[#00685f]">
                Clinic billing
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.08em]">
              Explore
            </h3>
            <div className="mt-4 space-y-2 text-sm text-[#3d4947]">
              <a href="#about" className="block hover:text-[#00685f]">
                About MediNovel
              </a>
              <a href="#demo" className="block hover:text-[#00685f]">
                Book a demo
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.08em]">
              Contact
            </h3>
            <div className="mt-4 space-y-2 text-sm text-[#3d4947]">
              <p>Email: <a href="mailto:info@medinovel.com" className="text-[#00685f] hover:underline">info@medinovel.com</a></p>
              <p>Phone: +91 9923569431 / +91 7875433447</p>
              <p>WhatsApp: <a href="https://wa.me/919834007250?text=Hello%20Team%2C%20Can%20you%20please%20share%20the%20plan%20details%3F" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">+91 9834007250</a></p>
              <p>Mon-Sat, 9:00 AM - 8:00 PM IST</p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-bold text-[#00685f] hover:underline"
              >
                Clinic portal login
              </button>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 pt-6 text-xs text-[#3d4947] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 MediNovel. Built for doctors, hospitals & clinics.</span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#00685f]" /> Secure, role-based clinic access
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