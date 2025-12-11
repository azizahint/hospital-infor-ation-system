import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// --- Tool Definitions ---

const getPatientsTool: FunctionDeclaration = {
  name: "getPatients",
  description: "Get a list of all registered patients to find IDs or check existence.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const registerPatientTool: FunctionDeclaration = {
  name: "registerPatient",
  description: "Register a new patient into the system (Agent 3).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Full name of the patient" },
      dob: { type: Type.STRING, description: "Date of birth (YYYY-MM-DD)" },
      gender: { type: Type.STRING, description: "Male, Female, or Other" },
      contact: { type: Type.STRING, description: "Phone number or email" },
    },
    required: ["name", "dob", "gender", "contact"],
  },
};

const scheduleAppointmentTool: FunctionDeclaration = {
  name: "scheduleAppointment",
  description: "Schedule a new appointment (Agent 4). Checks for conflicts automatically.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientId: { type: Type.STRING, description: "The ID of the patient" },
      date: { type: Type.STRING, description: "Date of appointment (YYYY-MM-DD)" },
      time: { type: Type.STRING, description: "Time of appointment (HH:MM)" },
      doctor: { type: Type.STRING, description: "Name of the doctor" },
      reason: { type: Type.STRING, description: "Reason for visit or appointment type" },
    },
    required: ["patientId", "date", "time", "doctor", "reason"],
  },
};

const createInvoiceTool: FunctionDeclaration = {
  name: "createInvoice",
  description: "Generate a billing invoice for a patient (Agent 2).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientId: { type: Type.STRING, description: "The ID of the patient" },
      amount: { type: Type.NUMBER, description: "Cost of the service" },
      description: { type: Type.STRING, description: "Description of the charge" },
    },
    required: ["patientId", "amount", "description"],
  },
};

const addMedicalNoteTool: FunctionDeclaration = {
  name: "addMedicalNote",
  description: "Add a clinical note to a patient's record (Agent 1).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientId: { type: Type.STRING, description: "The ID of the patient" },
      noteContent: { type: Type.STRING, description: " The clinical observation or summary" },
      type: { type: Type.STRING, description: "Type of note: Consultation, Lab Result, or Summary" },
    },
    required: ["patientId", "noteContent", "type"],
  },
};

export const tools = [
  getPatientsTool,
  registerPatientTool,
  scheduleAppointmentTool,
  createInvoiceTool,
  addMedicalNoteTool,
];

// --- Service Class ---

export class GeminiService {
  private ai: GoogleGenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.API_KEY || ''; 
    this.ai = new GoogleGenAI({ apiKey });
    // Using gemini-2.5-flash as the reliable workhorse for demos, 
    // though the prompt mentions Gemini 3 Pro (which is preview).
    this.model = "gemini-2.5-flash"; 
  }

  createChatSession() {
    return this.ai.chats.create({
      model: this.model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: tools }],
      },
    });
  }
}

export const geminiService = new GeminiService();
