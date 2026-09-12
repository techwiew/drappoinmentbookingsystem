import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Pill,
  Stethoscope,
  Users,
} from "lucide-react";

export const LANDING_COPY = {
  brand: {
    name: "MediNovel",
    badge: "India Clinic OS",
    tagline: "A calmer operating system for care",
    portal: "Launch Clinic Portal",
  },
  navigation: {
    features: "Features",
    solutions: "Solutions",
    about: "About",
    contact: "Contact",
    demo: "Book a Demo",
  },
  hero: {
    badge: "Built for doctors, reception teams, and growing clinics/hospitals",
    titleBefore: "The modern operating system for",
    titleHighlight: "hospital and clinics",
    description:
      "Move from crowded queues and scattered records to one steady workflow for appointments, consultations, patients, and payments.",
    demo: "Book a Live Demo",
  },
  preview: {
    workspace: "MediNovel workspace / Dr. Sharma Clinic",
    live: "Live queue active",
    queueTitle: "Live OPD Queue",
    queueSummary: "14 patients waiting · avg 8 min",
    walkIn: "+ Walk-in",
    queueUpdates: "Queue updates:",
    automatic: "automatic",
    displaySync: "TV display sync",
    consultationTitle: "Consultation workspace",
    patientId: "Patient #SHC-1048",
    vitals: ["BP", "Pulse", "SpO2", "Weight"],
    medicinesTitle: "Prescribed medicines",
    addMedicine: "+ Add medicine",
    digitalPrescription: "Digital prescription ready to share",
    insightsTitle: "Daily insights",
    collections: "Today's collections",
    collectionValue: "INR 18,500",
    billed: "32 consultations billed",
    doctorsOnDuty: "Doctors on duty",
    roomOne: "Room 1",
    roomTwo: "Room 2",
    scheduled: "Scheduled",
    explore: "Explore the full clinic workspace",
    activePatient: "Kavita Verma",
    activePatientMeta: "(38y, F)",
    activePatientReason: "Follow-up · Hypothyroidism",
    activePatientStatus: "IN CABIN",
    vitalValues: [
      ["BP", "126/82"],
      ["Pulse", "76 bpm"],
      ["SpO2", "99%"],
      ["Weight", "63.5 kg"],
    ],
    upiLabel: "UPI / QR",
    upiValue: "INR 14,200",
    cashLabel: "Cash",
    cashValue: "INR 4,300",
  },
  features: {
    eyebrow: "Engineered for outpatient excellence",
    title: "Everything your clinic needs to run at peak efficiency",
    description:
      "The practical tools your team needs to move patients through care with less friction and more visibility.",
  },
  solutions: {
    title: "A better fit for every clinic setup",
    description:
      "Start with the workflow you have today and grow into the system you need tomorrow.",
  },
  about: {
    eyebrow: "Our approach",
    title: "Less clinic chaos. More time for care.",
    paragraphs: [
      "MediNovel brings the front desk and consultation room into one dependable rhythm. Every role sees the work that belongs to them, while the clinic owner gets a clear view of the day.",
      "It is designed for real outpatient settings: changing walk-ins, multiple doctors, returning patients, pending fees, and the small details that make a patient feel looked after.",
    ],
    stats: [
      ["150+", "clinic-ready workflows"],
      ["< 15m", "guided onboarding"],
      ["Zero", "hardware required"],
    ],
    transformationTitle: "Clinic transformation",
    transformationSubtitle: "A clearer day after 30 days",
    benchmarkLabels: [
      ["Average OPD wait time", "48m to 14m", "w-[72%]"],
      ["Prescription drafting", "4.2x faster", "w-[85%]"],
      ["Fee collection visibility", "99.8% tracked", "w-[98%]"],
    ],
    quote: "The team sees the same day, not five different versions of it.",
    quoteBy: "Dr. A. K. Sen · Mumbai",
  },
  testimonials: {
    eyebrow: "From the clinic floor",
    title: "Loved by teams that have patients waiting",
  },
  demo: {
    eyebrow: "Personalized walkthrough",
    title: "See MediNovel in your clinic's rhythm",
    description:
      "Tell us a little about your setup and we'll show you the workflows that matter to your team.",
    benefits: [
      "Confirmation by email or phone",
      "A focused 20-minute walkthrough",
      "No pressure and no card required",
    ],
    titleForm: "Schedule a live demo",
    formDescription: "We'll follow up with a time that works for your clinic.",
    nameLabel: "Doctor or admin name",
    namePlaceholder: "Dr. Vikram Sen",
    phoneLabel: "Phone number",
    phonePlaceholder: "98200 12345",
    clinicTypeLabel: "Clinic type",
    cityLabel: "City",
    cityPlaceholder: "Mumbai",
    clinicTypes: [
      "Solo doctor clinic",
      "Multi-specialty clinic",
      "Polyclinic",
      "Daycare hospital",
    ],
    submit: "Schedule My Demo",
    confirmation:
      "Thanks. Your request is noted and our team will contact you shortly.",
    disclaimer: "Your details are used only to arrange this walkthrough.",
  },
  portal: {
    title: "Already running a MediNovel clinic?",
    description:
      "Open the workspace for your doctor, receptionist, or clinic administration team.",
    action: "Open Clinic Portal",
  },
  footer: {
    description:
      "A practical clinic management workspace for better queues, clearer consultations, and calmer days.",
    privacy: "Built with privacy in mind",
    solutions: "Solutions",
    explore: "Explore",
    contact: "Contact",
    patientQueue: "Patient queue",
    consultations: "Consultations",
    billing: "Clinic billing",
    about: "About MediNovel",
    demo: "Book a demo",
    supportEmail: "info@medinovel.com",
    supportPhones: "+91 9923569431 / +91 7875433447",
    whatsappPhone: "+91 9834007250",
    whatsappUrl: "https://wa.me/919834007250?text=Hello%20Team%2C%20Can%20you%20please%20share%20the%20plan%20details%3F",
    supportHours: "Mon-Sat, 9:00 AM - 8:00 PM IST",
    login: "Clinic portal login",
    copyright: "© 2026 MediNovel. Built for doctors, hospitals & clinics.",
    secure: "Secure, role-based clinic access",
  },
};

export const LANDING_FEATURES = [
  {
    icon: Users,
    title: "Smart Patient Queue",
    description:
      "Keep crowded waiting rooms calm with live tokens, clear status, and a queue your whole team can see.",
    points: [
      "Doctor and reception queue controls",
      "Walk-in and direct check-in flow",
    ],
    wide: true,
  },
  {
    icon: Pill,
    title: "Digital Consultations",
    description:
      "Capture structured notes, diagnoses, follow-ups, and prescriptions without breaking your consultation rhythm.",
    points: [
      "Reusable medicine entries",
      "Draft and complete consultation states",
    ],
  },
  {
    icon: CalendarDays,
    title: "Multi-doctor Scheduling",
    description:
      "Coordinate appointments across doctors, specialties, and busy clinic days from one shared calendar.",
    points: ["Conflict-aware appointment flow", "Doctor-specific queue views"],
  },
  {
    icon: CreditCard,
    title: "Simple Clinic Billing",
    description:
      "Record consultation fees, discounts, additional charges, and payment status while the patient is still there.",
    points: [
      "Cash, UPI, card, and other methods",
      "Clear pending payment follow-up",
    ],
    wide: true,
  },
];

export const LANDING_SOLUTIONS = [
  {
    title: "Solo doctors",
    description:
      "Keep the visit focused with fast patient lookup, queue, and consultation notes.",
    icon: Stethoscope,
    points: ["Quick registration", "Digital prescriptions", "Simple billing"],
  },
  {
    title: "Growing clinics",
    description:
      "Give doctors and receptionists a shared source of truth across a busy day.",
    icon: Users,
    points: ["Multi-doctor queues", "Role-based access", "Payment follow-up"],
  },
  {
    title: "Clinic networks",
    description:
      "Bring tenant-level control and clear reporting to every clinic in your network.",
    icon: BarChart3,
    points: [
      "Central oversight",
      "Subscription visibility",
      "Clinic performance",
    ],
  },
];

export const LANDING_TESTIMONIALS = [
  {
    quote:
      "Our reception desk can finally see exactly who is waiting and what needs attention next. The clinic feels calmer every evening.",
    name: "Dr. Raj Sharma",
    role: "General Physician, Mumbai",
    initials: "RS",
  },
  {
    quote:
      "The consultation flow is quick enough to use between patients, but structured enough that nothing important gets lost afterwards.",
    name: "Dr. Priya Patel",
    role: "Consultant Physician, Pune",
    initials: "PP",
  },
];

export const LANDING_NAV_LINKS = [
  ["Features", "features"],
  ["Solutions", "solutions"],
  ["About", "about"],
  ["Contact", "demo"],
];

export const LANDING_QUEUE_PATIENTS = [
  ["#09", "Ramesh Iyer", "BP check and lab review", "11:42 AM"],
  ["#10", "Aarav Mehta", "Fever, sore throat", "11:55 AM"],
  ["#11", "Sunita Deshmukh", "Joint pain assessment", "12:05 PM"],
];

export const LANDING_MEDICINES = [
  ["Thyronorm 50 mcg", "1 tab · morning · 60 days", "Refill"],
  ["Shelcal 500 HD", "1 tab · after lunch · 30 days", "New"],
];

export const LANDING_DOCTORS_ON_DUTY = [
  ["Dr. Raj M.", "Room 1"],
  ["Dr. Priya P.", "Room 2"],
  ["Dr. Amit K.", "Scheduled"],
];
