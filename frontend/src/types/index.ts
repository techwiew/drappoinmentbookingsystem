export type Role = 'SUPER_ADMIN' | 'DOCTOR' | 'RECEPTIONIST';

export interface User {
  id: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  name?: string;
  clinic?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
    pincode?: string;
    tokenPrefix?: string;
    subscription?: {
      planName: string;
      status: string;
      endDate: string;
    } | null;
  } | null;
  doctor?: {
    id: string;
    name: string;
    specialization: string;
    qualification?: string;
    registrationNumber?: string;
    consultationFee: number;
    workingDays?: string[];
    workingHours?: { start: string; end: string };
  } | null;
  receptionist?: {
    id: string;
    name: string;
    mobile?: string;
  } | null;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  pincode: string;
  tokenPrefix: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  subscription?: {
    id?: string;
    planName: string;
    planCode?: string;
    price?: number;
    status: string;
    startDate?: string;
    endDate: string;
    billingCycle?: string;
    amount?: number;
  } | null;
  doctorCount?: number;
  receptionistCount?: number;
  patientCount?: number;
  appointmentCount?: number;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  mobile: string;
  specialization: string;
  qualification: string;
  registrationNumber: string;
  consultationFee: number;
  status: 'ACTIVE' | 'INACTIVE';
  workingDays: string[];
  workingHours: { start: string; end: string };
  assignedPatientsCount?: number;
  totalAppointmentsCount?: number;
  totalConsultationsCount?: number;
  createdAt: string;
}

export interface Receptionist {
  id: string;
  name: string;
  email: string;
  mobile: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Patient {
  id: string;
  patientNumber: string;
  fullName: string;
  dateOfBirth?: string;
  age?: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bloodGroup?: string;
  allergies?: string;
  existingIllness?: string;
  medicalConditions?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactMobile?: string;
  notes?: string;
  assignedDoctors?: {
    id: string;
    name: string;
    specialization: string;
    qualification?: string;
    consultationFee?: number;
  }[];
  totalVisits?: number;
  totalConsultations?: number;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  patientMobile: string;
  patientGender: string;
  patientAge?: number;
  patientBloodGroup?: string;
  patientAllergies?: string;
  patientExistingIllness?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'NEW_PATIENT' | 'FOLLOW_UP' | 'WALK_IN' | 'EMERGENCY';
  tokenNumber: number;
  status:
    | 'BOOKED'
    | 'CHECKED_IN'
    | 'WAITING'
    | 'IN_CONSULTATION'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW'
    | 'SKIPPED';
  consultationFee: number;
  notes?: string;
  consultationId?: string | null;
  consultationStatus?: string | null;
  paymentStatus?: 'PAID' | 'PENDING' | 'PARTIALLY_PAID';
  createdAt: string;
}

export interface QueueSummary {
  total: number;
  waiting: number;
  inConsultation: number;
  completed: number;
  skipped: number;
  noShow: number;
  booked: number;
}

export interface QueueData {
  date: string;
  currentPatient: Appointment | null;
  nextPatient: Appointment | null;
  waitingList: Appointment[];
  completedList: Appointment[];
  skippedList: Appointment[];
  bookedList: Appointment[];
  noShowList: Appointment[];
  allQueue: Appointment[];
  summary: QueueSummary;
}

export interface PrescriptionItem {
  id?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorRegistrationNumber?: string;
  patientName?: string;
  patientNumber?: string;
  patientAge?: number;
  patientGender?: string;
  patientAllergies?: string;
  chiefComplaint: string;
  symptoms?: string;
  diagnosis: string;
  doctorNotes?: string;
  advice?: string;
  testsRecommended?: string;
  nextVisitDate?: string;
  followUpNotes?: string;
  status: 'DRAFT' | 'COMPLETED';
  createdAt: string;
  prescription?: {
    id: string;
    prescribedAt: string;
    items: PrescriptionItem[];
  } | null;
}

export interface Payment {
  id: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  patientMobile: string;
  doctorId?: string;
  doctorName?: string;
  appointmentId?: string;
  tokenNumber?: number;
  consultationFee: number;
  additionalFee: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'OTHER';
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIALLY_PAID';
  transactionReference?: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  price: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  maxDoctors: number;
  maxReceptionists: number;
  features: string[] | string;
}

export interface DoctorDashboardKPIs {
  totalToday: number;
  waitingCount: number;
  inConsultationCount: number;
  completedCount: number;
  noShowCount: number;
  newPatientsCount: number;
  returningPatientsCount: number;
  todayCollection: number;
  pendingPayments: number;
  followUpsCount: number;
}
