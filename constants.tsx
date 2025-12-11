import { Patient, Appointment, Invoice, AgentType } from './types';
import React from 'react';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'P001',
    name: 'John Doe',
    dob: '1980-05-15',
    gender: 'Male',
    contact: '555-0101',
    insuranceProvider: 'HealthGuard',
    insurancePolicyNumber: 'HG-998877',
    medicalHistory: [
      { id: 'N1', date: '2023-10-10', type: 'Consultation', content: 'Patient reported mild hypertension.', doctor: 'Dr. Smith' }
    ]
  },
  {
    id: 'P002',
    name: 'Jane Smith',
    dob: '1992-08-22',
    gender: 'Female',
    contact: '555-0202',
    insuranceProvider: 'MediCare+',
    insurancePolicyNumber: 'MC-112233',
    medicalHistory: []
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 'A001', patientId: 'P001', patientName: 'John Doe', date: '2023-10-25', time: '10:00', type: 'Checkup', doctor: 'Dr. Smith', status: 'Completed' },
  { id: 'A002', patientId: 'P002', patientName: 'Jane Smith', date: '2023-11-15', time: '14:30', type: 'Consultation', doctor: 'Dr. Jones', status: 'Scheduled' }
];

export const INITIAL_INVOICES: Invoice[] = [
  { id: 'I001', patientId: 'P001', patientName: 'John Doe', amount: 150.00, status: 'Paid', description: 'General Consultation', date: '2023-10-25' },
  { id: 'I002', patientId: 'P002', patientName: 'Jane Smith', amount: 200.00, status: 'Pending', description: 'Specialist Visit', date: '2023-11-15' }
];

export const SYSTEM_INSTRUCTION = `
You are the ICAM (Integrated Clinical Administration Management) Orchestrator. 
Your goal is to manage a hospital's administrative tasks by delegating to four specialized sub-agents.

You have access to the following tools to perform actions. ALWAYS use a tool if the user's request requires fetching data, updating records, scheduling, or billing.

**Your Sub-Agents & Responsibilities:**

1.  **Medical Records Agent (SA1):** 
    -   Accesses medical history.
    -   Adds new medical notes.
    -   Summarizes patient history.
    
2.  **Billing & Payments Agent (SA2):** 
    -   Creates invoices.
    -   Checks invoice status.
    -    handles insurance queries (simulated).

3.  **Registration Agent (SA3):** 
    -   Registers new patients.
    -   Updates demographics.
    -   Validates information.

4.  **Scheduling Agent (SA4):** 
    -   Schedules appointments.
    -   Checks for schedule conflicts.
    -   Cancels appointments.

**General Rules:**
-   If a user asks to do something, infer which agent should handle it.
-   If you need missing information (e.g., patient name for a lookup), ask the user for it.
-   Be professional, clinical, and efficient.
-   When you use a tool, assume the action was successful if the tool returns a success message.
-   Current Date for context: ${new Date().toLocaleDateString()}.

**Tone:** Helpful, efficient, professional medical administrator.
`;
