export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  medicalHistory: MedicalNote[];
}

export interface MedicalNote {
  id: string;
  date: string;
  type: 'Consultation' | 'Lab Result' | 'Summary';
  content: string;
  doctor: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string; // ISO string
  time: string;
  type: string;
  doctor: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  description: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  agentName?: string; // Which sub-agent handled this
  timestamp: Date;
}

export enum AgentType {
  ORCHESTRATOR = 'Orchestrator',
  RECORDS = 'Medical Records (SA1)',
  BILLING = 'Billing & Payments (SA2)',
  REGISTRATION = 'Registration (SA3)',
  SCHEDULING = 'Scheduling (SA4)',
}

export interface AnalyticsData {
  name: string;
  value: number;
}