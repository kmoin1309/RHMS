import React, { useState, useEffect } from 'react';
import Navbar from "../../components/navbar";
import {
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  FileText,
  Download,
  Plus,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Trash2,
  Shield
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    activeAppointments: 0,
    revenue: 0
  });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // All Firebase Auth users
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for Data Recording
  const [formData, setFormData] = useState({
    // Personal Details
    name: '',
    gender: 'Male',
    age: '',
    height: '',
    weight: '',

    // Body Metrics
    glucose: '',
    bmi: '',

    // Vital Signs
    pulseRate: '',
    acetone: '',
    systolicBP: '',
    diastolicBP: '',
    spo2: '',
    temperature: '',
    activity: '',

    // Medical History
    pregnancies: '0',
    hypertensive: 'No',
    familyHypertension: 'No',
    cardiovascularDisease: 'No',
    stroke: 'No',
    familyDiabetes: 'No',
    diabetic: 'No',

    // Outcome
    outcome: '0'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'recording') {
      fetchDataset();
    }
  }, [activeTab]);

  // Calculate BMI automatically when height or weight changes
  useEffect(() => {
    if (formData.height && formData.weight) {
      const heightInM = parseFloat(formData.height) / 100;
      const weightInKg = parseFloat(formData.weight);
      if (heightInM > 0) {
        const bmi = (weightInKg / (heightInM * heightInM)).toFixed(1);
        setFormData(prev => ({ ...prev, bmi }));
      }
    }
  }, [formData.height, formData.weight]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch Stats
      try {
        const statsRes = await fetch('http://localhost:8080/api/admin/stats');
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.data);
      } catch (e) { console.error("Stats fetch failed", e); }

      // Fetch Patients
      try {
        const patientsRes = await fetch('http://localhost:8080/api/admin/patients');
        const patientsData = await patientsRes.json();
        if (patientsData.success) setPatients(patientsData.data);
      } catch (e) { console.error("Patients fetch failed", e); }

      // Fetch Doctors
      try {
        const doctorsRes = await fetch('http://localhost:8080/api/admin/doctors');
        const doctorsData = await doctorsRes.json();
        if (doctorsData.success) setDoctors(doctorsData.data);
      } catch (e) { console.error("Doctors fetch failed", e); }

      // Fetch All Users from Firebase Auth
      try {
        const usersRes = await fetch('http://localhost:8080/api/admin/users');
        const usersData = await usersRes.json();
        if (usersData.success) {
          setAllUsers(usersData.data);
          console.log(`✅ Loaded ${usersData.count} users from ${usersData.source}`);
        }
      } catch (e) { console.error("Users fetch failed", e); }

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDataset = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/dataset/all');
      const data = await res.json();
      if (data.success) setDataset(data.data);
    } catch (error) {
      console.error('Failed to fetch dataset:', error);
    }
  };

  const handleStatusUpdate = async (id, type, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        // Refresh data
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('Are you sure? This will seed the database with test data.')) return;

    try {
      const response = await fetch('http://localhost:8080/api/admin/seed', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Database seeded successfully');
        fetchDashboardData();
      } else {
        toast.error('Failed to seed database');
      }
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Error seeding database');
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDataSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/dataset/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Data recorded successfully');
        setFormData({
          name: '',
          gender: 'Male',
          age: '',
          height: '',
          weight: '',
          glucose: '',
          bmi: '',
          pulseRate: '',
          acetone: '',
          systolicBP: '',
          diastolicBP: '',
          spo2: '',
          temperature: '',
          activity: '',
          pregnancies: '0',
          hypertensive: 'No',
          familyHypertension: 'No',
          cardiovascularDisease: 'No',
          stroke: 'No',
          familyDiabetes: 'No',
          diabetic: 'No',
          outcome: '0'
        });
        fetchDataset();
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to record data');
    }
  };

  const handleExport = () => {
    window.open('http://localhost:8080/api/dataset/export', '_blank');
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDoctors = doctors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your hospital system efficiently</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <button
              onClick={handleSeedDatabase}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center"
            >
              <Database className="w-4 h-4 mr-2" />
              Seed DB
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              All Users
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'patients' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Patients
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'doctors' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Doctors
            </button>
            <button
              onClick={() => setActiveTab('recording')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'recording' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Data Recording
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} color="bg-blue-500" />
                  <StatCard title="Total Doctors" value={stats.totalDoctors} icon={Stethoscope} color="bg-green-500" />
                  <StatCard title="Active Appointments" value={stats.activeAppointments} icon={Calendar} color="bg-purple-500" />
                  <StatCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={DollarSign} color="bg-yellow-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">New patient registration</p>
                            <p className="text-xs text-gray-500">2 minutes ago</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">System Health</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Server Status</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Operational</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Database Connection</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Connected</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">AI Service</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patients Tab */}
            {activeTab === 'patients' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="text-lg font-bold text-gray-900">All Patients</h3>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {patient.name.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                <div className="text-sm text-gray-500">{patient.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {patient.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {patient.lastVisit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleStatusUpdate(patient.id, 'patient', patient.status === 'Active' ? 'Inactive' : 'Active')}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Toggle Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Doctors Tab */}
            {activeTab === 'doctors' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="text-lg font-bold text-gray-900">All Doctors</h3>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search doctors..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patients</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDoctors.map((doctor) => (
                        <tr key={doctor.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                {doctor.name.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                                <div className="text-sm text-gray-500">{doctor.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doctor.specialization}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doctor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {doctor.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doctor.patients}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleStatusUpdate(doctor.id, 'doctor', doctor.status === 'Active' ? 'Inactive' : 'Active')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Toggle Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Data Recording Tab */}
            {activeTab === 'recording' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Record New Patient Data</h3>
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </button>
                  </div>

                  <form onSubmit={handleDataSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Personal Details */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Users className="w-4 h-4 mr-2" /> Personal Details
                      </h4>
                      <input name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                      <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-2 border rounded">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      <input name="age" type="number" placeholder="Age" value={formData.age} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                      <div className="grid grid-cols-2 gap-2">
                        <input name="height" type="number" placeholder="Height (cm)" value={formData.height} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                        <input name="weight" type="number" placeholder="Weight (kg)" value={formData.weight} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                      </div>
                    </div>

                    {/* Vitals & Metrics */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Activity className="w-4 h-4 mr-2" /> Vitals & Metrics
                      </h4>
                      <input name="glucose" type="number" placeholder="Glucose Level" value={formData.glucose} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                      <div className="grid grid-cols-2 gap-2">
                        <input name="systolicBP" type="number" placeholder="Systolic BP" value={formData.systolicBP} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                        <input name="diastolicBP" type="number" placeholder="Diastolic BP" value={formData.diastolicBP} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                      </div>
                      <input name="pulseRate" type="number" placeholder="Pulse Rate" value={formData.pulseRate} onChange={handleInputChange} className="w-full p-2 border rounded" />
                      <input name="acetone" type="number" placeholder="Acetone Level" value={formData.acetone} onChange={handleInputChange} className="w-full p-2 border rounded" />
                    </div>

                    {/* Medical History */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <FileText className="w-4 h-4 mr-2" /> Medical History
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <select name="hypertensive" value={formData.hypertensive} onChange={handleInputChange} className="w-full p-2 border rounded">
                          <option value="No">Hypertension: No</option>
                          <option value="Yes">Hypertension: Yes</option>
                        </select>
                        <select name="familyDiabetes" value={formData.familyDiabetes} onChange={handleInputChange} className="w-full p-2 border rounded">
                          <option value="No">Fam Diabetes: No</option>
                          <option value="Yes">Fam Diabetes: Yes</option>
                        </select>
                      </div>
                      <select name="cardiovascularDisease" value={formData.cardiovascularDisease} onChange={handleInputChange} className="w-full p-2 border rounded">
                        <option value="No">Cardiovascular Disease: No</option>
                        <option value="Yes">Cardiovascular Disease: Yes</option>
                      </select>

                      <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4">
                        Record Data
                      </button>
                    </div>
                  </form>
                </div>

                {/* Dataset Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Recorded Dataset ({dataset.length} entries)</h3>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Age/Gender</th>
                          <th className="px-4 py-2 text-left">BMI</th>
                          <th className="px-4 py-2 text-left">Glucose</th>
                          <th className="px-4 py-2 text-left">BP</th>
                          <th className="px-4 py-2 text-left">History</th>
                          <th className="px-4 py-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dataset.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2">{row.name}</td>
                            <td className="px-4 py-2">{row.age} / {row.gender}</td>
                            <td className="px-4 py-2">{row.bmi}</td>
                            <td className="px-4 py-2">{row.glucose}</td>
                            <td className="px-4 py-2">{row.systolicBP}/{row.diastolicBP}</td>
                            <td className="px-4 py-2">
                              {row.hypertensive === 'Yes' && <span className="text-red-500 mr-1">HTN</span>}
                              {row.familyDiabetes === 'Yes' && <span className="text-orange-500">Fam-DB</span>}
                            </td>
                            <td className="px-4 py-2">{new Date(row.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
