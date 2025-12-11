import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Calendar, DollarSign, Activity } from 'lucide-react';
import { Patient, Appointment, Invoice } from '../types';

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  invoices: Invoice[];
}

const StatCard: React.FC<{ title: string; value: string; icon: any; color: string }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-500 mb-1 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
      <Icon className={color.replace('bg-', 'text-')} size={24} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ patients, appointments, invoices }) => {
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const pendingRevenue = invoices.filter(i => i.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0);
  const upcomingAppointments = appointments.filter(a => new Date(a.date) >= new Date()).length;

  const appointmentData = [
    { name: 'Mon', count: 4 },
    { name: 'Tue', count: 3 },
    { name: 'Wed', count: 7 },
    { name: 'Thu', count: 5 },
    { name: 'Fri', count: 6 },
  ];

  const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];
  const statusData = [
    { name: 'Completed', value: appointments.filter(a => a.status === 'Completed').length },
    { name: 'Scheduled', value: appointments.filter(a => a.status === 'Scheduled').length },
    { name: 'Cancelled', value: appointments.filter(a => a.status === 'Cancelled').length },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value={patients.length.toString()} icon={Users} color="bg-blue-500" />
        <StatCard title="Upcoming Visits" value={upcomingAppointments.toString()} icon={Calendar} color="bg-purple-500" />
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Pending Payment" value={`$${pendingRevenue.toLocaleString()}`} icon={Activity} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Weekly Appointment Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Appointment Status</h3>
          <div className="h-64 flex justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-sm text-slate-600 mt-2">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
