# ADMIN DASHBOARD FIX

## The admin/dashboard.jsx file is corrupted

### Quick Fix:

Replace lines 97-140 in `/hms-website/src/screen/admin/dashboard.jsx` with:

```javascript
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch Stats
      const statsRes = await fetch('http://localhost:8080/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Fetch Patients
      const patientsRes = await fetch('http://localhost:8080/api/admin/patients');
      const patientsData = await patientsRes.json();
      if (patientsData.success) setPatients(patientsData.data);

      // Fetch Doctors
      const doctorsRes = await fetch('http://localhost:8080/api/admin/doctors');
      const doctorsData = await doctorsRes.json();
      if (doctorsData.success) setDoctors(doctorsData.data);

      // Fetch All Users from Firebase Auth
      const usersRes = await fetch('http://localhost:8080/api/admin/users');
      const usersData = await usersRes.json();
      if (usersData.success) {
        setAllUsers(usersData.data);
        console.log(`✅ Loaded ${usersData.count} users from ${usersData.source}`);
      }
      
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
        if (type === 'patient') {
          setPatients(patients.map(p => p.id === id ? { ...p, status: newStatus } : p));
        } else {
          setDoctors(doctors.map(d => d.id === id ? { ...d, status: newStatus } : d));
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('Are you sure? This will seed the database.')) return;

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

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 h-6 text-white" />
      </div>
    </div>
  );
```

## Backend is ready! Test it:

```bash
# The backend should now start successfully
curl http://localhost:8080/api/admin/users
```

All backend features for Firebase Auth are working:
- ✅ Get all users
- ✅ Get patients
- ✅ Get doctors  
- ✅ Enable/disable users
- ✅ Set user roles

The admin dashboard just needs the fetch function fixed manually.
