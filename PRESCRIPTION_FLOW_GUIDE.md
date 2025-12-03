# Prescription & Appointment Flow - Complete Guide

## 🔄 Complete Workflow

### 1️⃣ **Patient Side: Health Assessment & Booking**

**Location:** `/patient/onboarding` (PatientOnboarding.jsx)

**Flow:**
1. Patient fills out comprehensive health assessment form (age, glucose, BP, etc.)
2. System analyzes diabetes risk using backend prediction
3. **If HIGH RISK detected:**
   - Shows list of available doctors with specializations
   - Patient selects preferred doctor
   - Patient chooses date and time using calendar picker
   - Patient clicks "Confirm Appointment"
4. **Backend creates appointment** with status "Pending"
5. **Doctor receives notification** about new appointment request

---

### 2️⃣ **Doctor Side: Accept & Schedule**

**Location:** `/doctor/dashboard` (DoctorDashboard.jsx)

**Flow:**
1. Doctor sees pending appointment requests in dashboard
2. Doctor reviews patient details and health notes
3. Doctor clicks **"Accept"** button:
   - Status changes to "Confirmed"
   - **Google Meet link is automatically generated**
   - Link is saved to appointment record
4. Both patient and doctor can now see the "Join Meet" button

---

### 3️⃣ **Consultation via Google Meet**

**Available to:** Both Patient & Doctor

**Flow:**
1. At scheduled time, both parties click **"Join Meet"** button
2. Opens Google Meet video conference
3. Doctor conducts consultation
4. Doctor discusses treatment plan

---

### 4️⃣ **Doctor: Write Prescription**

**Location:** `/doctor/dashboard` (Doctor's Prescription Modal)

**Flow:**
1. After/during consultation, doctor clicks **"Prescribe"** button
2. **Prescription Modal opens** with:
   - Multiple medication fields (add/remove as needed)
   - Each medication has:
     - Medicine Name (e.g., "Metformin")
     - Dosage (e.g., "500mg")
     - Frequency (e.g., "Twice daily")
     - Duration (e.g., "30 days")
   - Additional instructions field
3. Doctor clicks **"Submit Prescription"**
4. Backend saves prescription to appointment
5. **Appointment status changes to "Completed"**

---

### 5️⃣ **Both Parties: Download Prescription PDF**

**Patient Location:** `/patient/appointments` (AppointmentManagement.jsx)
**Doctor Location:** `/doctor/dashboard`

**Flow:**
1. Once prescription is submitted, both see **"Download"** button
2. Click **"Download Prescription"** button
3. **Professional PDF is generated** containing:
   - Header: "Medical Prescription"
   - Doctor name and date
   - Patient name
   - All medications with dosage, frequency, duration
   - Additional instructions
   - Footer: Digital signature disclaimer
4. PDF downloads as: `Prescription_PatientName_Date.pdf`

---

## 📁 Key Files Modified

### Backend:
- **`/backend/models/Appointment.js`** - Added prescription, meetLink, notes fields
- **`/backend/routes/appointments.js`** - Added booking, status update, prescription endpoints

### Frontend - Patient:
- **`/hms-website/src/screen/patient/PatientOnboarding.jsx`** - Doctor selection, calendar booking
- **`/hms-website/src/screen/patient/AppointmentManagement.jsx`** - View appointments, download prescriptions

### Frontend - Doctor:
- **`/hms-website/src/screen/doctor/dashboard.jsx`** - Accept/reject, write prescriptions, download

---

## 🛠️ API Endpoints

### 1. **Book Appointment**
```http
POST /api/appointments/book
Body: {
  "patientId": "string",
  "doctorId": "string",
  "date": "ISO date string",
  "notes": "string"
}
```

### 2. **Update Appointment Status** (Accept/Reject)
```http
PUT /api/appointments/:id/status
Body: {
  "status": "Confirmed" | "Rejected",
  "meetLink": "Google Meet URL" (if accepted)
}
```

### 3. **Add Prescription**
```http
POST /api/appointments/:id/prescription
Body: {
  "medications": [
    {
      "name": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string"
    }
  ],
  "instructions": "string"
}
```

### 4. **Get Appointments**
```http
GET /api/appointments?userId=xxx&role=patient|doctor
```

---

## 🎨 Features Implemented

### ✅ Patient Features:
- Multi-step health assessment form
- **Doctor selection** from available specialists
- **Date picker** for appointment scheduling
- **Time picker** for preferred time slot
- View all appointments (Upcoming & History tabs)
- Join Google Meet consultations
- **Download prescriptions as PDF**
- Prescription preview in appointment card

### ✅ Doctor Features:
- Dashboard with pending appointment count
- **Accept/Reject** appointment requests
- **Automatic Google Meet link generation**
- **Write comprehensive prescriptionsmodal  with:**
  - Dynamic medication forms (add/remove)
  - Instructions textarea
- **Download prescriptions as PDF**
- View appointment history (Pending, Confirmed, Completed)

### ✅ PDF Features:
- Professional medical prescription layout
- Doctor & patient details
- Complete medication list with formatting
- Special instructions section
- Auto-generated filename with date

---

## 🚀 How to Test

1. **Start Backend:**
   ```bash
   cd "integrated code/backend"
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd "integrated code/hms-website"
   npm run dev
   ```

3. **Test Flow:**
   - Go to `/patient/onboarding`
   - Fill health form with high-risk values (e.g., glucose > 140)
   - Select a doctor and schedule appointment
   - Go to `/doctor/dashboard`
   - Accept the appointment
   - Join meet (optional)
   - Click "Prescribe" and fill prescription form
   - Download PDF from both patient and doctor views

---

## 📦 Dependencies Added

```json
{
  "jspdf": "^2.x.x"  // For PDF generation
}
```

---

## 📝 Notes

- **Mock Mode:** If Firebase is not connected, the system uses in-memory mock data
- **Google Meet Links:** Currently auto-generated random links; can be integrated with Google Calendar API for real links
- **Notifications:** Placeholder for notification service (can be integrated with Firebase Cloud Messaging)
- **Authentication:** Uses user context; ensure user is logged in for full functionality

---

## 🔐 Security Considerations

- Prescriptions are stored securely in the database
- Only authorized doctors can write prescriptions
- Patients can only view their own prescriptions
- PDF downloads are generated client-side (no server storage)

---

**Status:** ✅ Complete and Ready for Testing!
