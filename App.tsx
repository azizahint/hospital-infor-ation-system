import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import { INITIAL_PATIENTS, INITIAL_APPOINTMENTS, INITIAL_INVOICES } from './constants';
import { Patient, Appointment, Invoice, ChatMessage, AgentType } from './types';
import { geminiService } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid'; // Just kidding, using random string gen for simplicity
import { Search, UserPlus, FileText, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { FunctionCallPart, FunctionResponsePart } from '@google/genai';

// Helper to generate IDs
const genId = () => Math.random().toString(36).substring(2, 9);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  
  // Chat State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const chatSessionRef = useRef<any>(null);

  // Initialize Chat Session
  useEffect(() => {
    chatSessionRef.current = geminiService.createChatSession();
  }, []);

  // --- Tool Executors ---
  // These functions actually modify the React State based on AI requests

  const executeTool = async (functionCall: any): Promise<any> => {
    const { name, args } = functionCall;
    console.log(`Executing tool: ${name}`, args);

    switch (name) {
      case 'getPatients': {
        return { patients: patients.map(p => ({ id: p.id, name: p.name, dob: p.dob })) };
      }

      case 'registerPatient': {
        const newPatient: Patient = {
          id: `P${genId().toUpperCase()}`,
          name: args.name,
          dob: args.dob,
          gender: args.gender,
          contact: args.contact,
          insuranceProvider: 'Pending',
          insurancePolicyNumber: 'Pending',
          medicalHistory: []
        };
        setPatients(prev => [...prev, newPatient]);
        setActiveTab('registration'); // Auto-switch view
        return { status: 'success', patientId: newPatient.id, message: 'Patient registered successfully.' };
      }

      case 'scheduleAppointment': {
        // Simple conflict check
        const conflict = appointments.find(a => a.doctor === args.doctor && a.date === args.date && a.time === args.time);
        if (conflict) {
            return { status: 'error', message: 'Doctor is already booked at this time.' };
        }
        
        const patient = patients.find(p => p.id === args.patientId);
        if(!patient) return { status: 'error', message: 'Patient ID not found.' };

        const newAppt: Appointment = {
          id: `A${genId().toUpperCase()}`,
          patientId: args.patientId,
          patientName: patient.name,
          date: args.date,
          time: args.time,
          doctor: args.doctor,
          type: args.reason,
          status: 'Scheduled'
        };
        setAppointments(prev => [...prev, newAppt]);
        setActiveTab('scheduling');
        return { status: 'success', appointmentId: newAppt.id, message: 'Appointment scheduled.' };
      }

      case 'createInvoice': {
        const patient = patients.find(p => p.id === args.patientId);
        if(!patient) return { status: 'error', message: 'Patient ID not found.' };

        const newInv: Invoice = {
            id: `I${genId().toUpperCase()}`,
            patientId: args.patientId,
            patientName: patient.name,
            amount: args.amount,
            description: args.description,
            status: 'Pending',
            date: new Date().toISOString().split('T')[0]
        };
        setInvoices(prev => [...prev, newInv]);
        setActiveTab('billing');
        return { status: 'success', invoiceId: newInv.id, message: 'Invoice generated.' };
      }

      case 'addMedicalNote': {
         const patientIndex = patients.findIndex(p => p.id === args.patientId);
         if(patientIndex === -1) return { status: 'error', message: 'Patient ID not found.' };

         const newNote = {
            id: `N${genId()}`,
            date: new Date().toISOString().split('T')[0],
            type: args.type,
            content: args.noteContent,
            doctor: 'AI Assistant'
         };
         
         const updatedPatients = [...patients];
         updatedPatients[patientIndex].medicalHistory.push(newNote);
         setPatients(updatedPatients);
         setActiveTab('records');
         return { status: 'success', noteId: newNote.id, message: 'Clinical note added.' };
      }

      default:
        return { error: 'Unknown tool' };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      // 1. Send message to Gemini
      let result = await chatSessionRef.current.sendMessage({ message: userMsg.content });
      
      // 2. Handle Tool Calls (Loop until no more tool calls)
      // Note: The new SDK structure returns candidates with function calls
      let functionCalls = result.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall);
      
      while (functionCalls && functionCalls.length > 0) {
        const responses: any[] = []; // Using any for tool response structure matching SDK needs
        
        for (const part of functionCalls) {
            const fc = part.functionCall!;
            // Execute the tool locally
            const functionResponse = await executeTool(fc);
            
            // Construct the response object for Gemini
            responses.push({
                functionResponse: {
                    name: fc.name,
                    id: fc.id, // Important: pass back the ID provided by Gemini
                    response: functionResponse
                }
            });
        }
        
        // Send tool results back to Gemini
        // We need to construct the `parts` array correctly for the SDK
        result = await chatSessionRef.current.sendMessage(responses);
        
        // Check if there are MORE tool calls (multi-step reasoning)
        functionCalls = result.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall);
      }

      // 3. Final Text Response
      const modelText = result.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || "Action completed.";
      
      // Attempt to determine agent persona based on context (simple heuristic)
      let agentName = AgentType.ORCHESTRATOR;
      if (modelText.includes("schedule") || modelText.includes("appointment")) agentName = AgentType.SCHEDULING;
      else if (modelText.includes("invoice") || modelText.includes("bill")) agentName = AgentType.BILLING;
      else if (modelText.includes("register") || modelText.includes("patient")) agentName = AgentType.REGISTRATION;
      else if (modelText.includes("medical") || modelText.includes("history")) agentName = AgentType.RECORDS;

      const modelMsg: ChatMessage = {
        id: genId(),
        role: 'model',
        content: modelText,
        agentName,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);

    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMsg: ChatMessage = {
        id: genId(),
        role: 'model',
        content: "I encountered an error connecting to the Orchestrator service. Please check your API Key configuration.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };


  // --- Render Views ---

  const renderRegistration = () => (
    <div className="p-8 animate-in fade-in">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <UserPlus className="text-medical-500" /> Patient Registration Database
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-4 font-semibold">ID</th>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">DOB</th>
                        <th className="p-4 font-semibold">Contact</th>
                        <th className="p-4 font-semibold">Gender</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(p => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-4 font-mono text-xs">{p.id}</td>
                            <td className="p-4 font-medium text-slate-900">{p.name}</td>
                            <td className="p-4">{p.dob}</td>
                            <td className="p-4">{p.contact}</td>
                            <td className="p-4">{p.gender}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderScheduling = () => (
    <div className="p-8 animate-in fade-in">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CalendarIcon className="text-purple-500" /> Appointment Schedule
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {appointments.map(appt => (
                <div key={appt.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide 
                                ${appt.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                  appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                {appt.status}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{appt.id}</span>
                        </div>
                        <h3 className="font-bold text-slate-800">{appt.patientName}</h3>
                        <p className="text-sm text-slate-500">{appt.type} with {appt.doctor}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-slate-700">{appt.time}</div>
                        <div className="text-sm text-slate-500">{new Date(appt.date).toLocaleDateString()}</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderBilling = () => (
    <div className="p-8 animate-in fade-in">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <DollarSign className="text-green-500" /> Invoices & Claims
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-4 font-semibold">Invoice ID</th>
                        <th className="p-4 font-semibold">Patient</th>
                        <th className="p-4 font-semibold">Description</th>
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold text-right">Amount</th>
                        <th className="p-4 font-semibold text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map(inv => (
                        <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-4 font-mono text-xs">{inv.id}</td>
                            <td className="p-4 font-medium text-slate-900">{inv.patientName}</td>
                            <td className="p-4">{inv.description}</td>
                            <td className="p-4">{inv.date}</td>
                            <td className="p-4 text-right font-mono">${inv.amount.toFixed(2)}</td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                    ${inv.status === 'Paid' ? 'bg-green-100 text-green-600' : 
                                      inv.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                                    {inv.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderRecords = () => (
    <div className="p-8 animate-in fade-in">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="text-orange-500" /> Electronic Health Records
        </h2>
        <div className="space-y-6">
            {patients.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{p.name}</h3>
                            <p className="text-sm text-slate-500">DOB: {p.dob} • ID: {p.id}</p>
                        </div>
                        <button className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors">
                            View Full Profile
                        </button>
                    </div>
                    
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Clinical Notes</h4>
                    {p.medicalHistory.length > 0 ? (
                        <div className="space-y-3">
                            {p.medicalHistory.map(note => (
                                <div key={note.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs font-bold text-medical-600">{note.type}</span>
                                        <span className="text-xs text-slate-400">{note.date}</span>
                                    </div>
                                    <p className="text-sm text-slate-700">{note.content}</p>
                                    <p className="text-xs text-slate-400 mt-1 italic">Signed: {note.doctor}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-slate-400 italic bg-slate-50 p-3 rounded-lg">No records found.</div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto relative scrollbar-hide">
          {!process.env.API_KEY && (
             <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-center py-1 text-xs font-bold z-50">
                Missing API_KEY in environment variables. Gemini features will not work.
             </div>
          )}
          {activeTab === 'dashboard' && <Dashboard patients={patients} appointments={appointments} invoices={invoices} />}
          {activeTab === 'registration' && renderRegistration()}
          {activeTab === 'scheduling' && renderScheduling()}
          {activeTab === 'billing' && renderBilling()}
          {activeTab === 'records' && renderRecords()}
        </div>

        {/* Chat Interface - Always visible on desktop */}
        <ChatInterface 
          messages={messages} 
          input={input} 
          setInput={setInput} 
          onSend={handleSend}
          isThinking={isThinking}
        />
      </main>
    </div>
  );
}

export default App;
