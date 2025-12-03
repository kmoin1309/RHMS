# 🔥 Firebase Authentication Users in Admin Dashboard

## ✅ Setup Complete!

Your **Admin Dashboard** now has access to all Firebase Authentication users.

## 🔌 Backend API Endpoints

### 1. **Get All Users (Firebase Auth)**
```javascript
GET /api/admin/users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uid": "abc123",
      "email": "user@example.com",
      "displayName": "John Doe",
      "photoURL": "https://...",
      "emailVerified": true,
      "disabled": false,
      "createdAt": "2025-01-21T...",
      "lastSignIn": "2025-01-22T...",
      "role": "patient",  // From custom claims
      "phoneNumber": "+1234567890",
      "providerData": [...]
    }
  ],
  "count": 25,
  "source": "firebase-auth"
}
```

### 2. **Get Patients Only**
```javascript
GET /api/admin/patients
```
Filters users with `role === 'patient'` from custom claims.

### 3. **Get Doctors Only**
```javascript
GET /api/admin/doctors
```
Filters users with `role === 'doctor'` or `role === 'admin'`.

### 4. **Update User Status (Enable/Disable)**
```javascript
PUT /api/admin/users/:uid/status
Body: { "status": "Active" } // or "Inactive"
```

### 5. **Set User Role (Custom Claims)**
```javascript
PUT /api/admin/users/:uid/role
Body: { 
  "role": "doctor",  // 'patient', 'doctor', or 'admin'
  "specialization": "Cardiology"  // Optional, for doctors
}
```

### 6. **Delete User**
```javascript
DELETE /api/admin/users/:uid
```

## 🖥️ Frontend Implementation

### Add "All Users" Tab

Add this to your AdminDashboard.jsx:

```javascript
// Add state
const [allUsers, setAllUsers] = useState([]);

// Add to fetchDashboardData()
const usersRes = await fetch('http://localhost:8080/api/admin/users');
const usersData = await usersRes.json();
if (usersData.success) {
  setAllUsers(usersData.data);
  console.log(`Loaded ${usersData.count} users from ${usersData.source}`);
}

// Add tab button
<button
  onClick={() => setActiveTab('users')}
  className={`px-4 py-2 rounded-lg text-sm font-medium ${
    activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
  }`}
>
  All Users ({allUsers.length})
</button>

// Add tab content
{activeTab === 'users' && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <h2 className="text-xl font-bold mb-4">All Firebase Users</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Role</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Created</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.map(user => (
            <tr key={user.uid} className="border-b hover:bg-gray-50">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                  )}
                  <span className="font-medium">{user.displayName || 'Unknown'}</span>
                </div>
              </td>
              <td className="p-3">{user.email}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded text-xs ${
                  user.role === 'doctor' ? 'bg-green-100 text-green-700' :
                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {user.role || 'patient'}
                </span>
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded text-xs ${
                  user.disabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {user.disabled ? 'Disabled' : 'Active'}
                </span>
              </td>
              <td className="p-3 text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="p-3">
                <button
                  onClick={() => handleToggleUserStatus(user.uid, user.disabled)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {user.disabled ? 'Enable' : 'Disable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
```

### Add Handler Function

```javascript
const handleToggleUserStatus = async (uid, currentlyDisabled) => {
  const newStatus = currentlyDisabled ? 'Active' : 'Inactive';
  
  try {
    const res = await fetch(`http://localhost:8080/api/admin/users/${uid}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (res.ok) {
      toast.success(`User ${currentlyDisabled ? 'enabled' : 'disabled'} successfully`);
      fetchDashboardData(); // Refresh data
    }
  } catch (error) {
    console.error('Error updating user status:', error);
    toast.error('Failed to update user status  ');
  }
};
```

## 🔒 Setting User Roles

To set custom claims for users (assign roles):

```javascript
const setUserRole = async (uid, role, specialization = null) => {
  try {
    const res = await fetch(`http://localhost:8080/api/admin/users/${uid}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, specialization })
    });
    
    const data = await res.json();
    if (data.success) {
      toast.success(`User updated to ${role}`);
      fetchDashboardData();
    }
  } catch (error) {
    toast.error('Failed to update role');
  }
};
```

## 📊 User Data Fields

Each user object contains:

- **uid**: Firebase unique ID
- **email**: User's email
- **displayName**: Display name
- **photoURL**: Profile photo URL
- **emailVerified**: Boolean
- **disabled**: Boolean (is user disabled)
- **createdAt**: Account creation time
- **lastSignIn**: Last sign-in time
- **role**: From custom claims ('patient', 'doctor', 'admin')
- **phoneNumber**: Phone number if set
- **providerData**: Array of auth providers used

## 🎯 Testing

1. **Check Firebase Connection:**
   - Backend should log: "Firebase Admin initialized"
   - If not, add `serviceAccountKey.json` to `backend/` folder

2. **Test API:**
   ```bash
   curl http://localhost:8080/api/admin/users
   ```

3. **View in Dashboard:**
   - Go to Admin Dashboard
   - Click "All Users" tab
   - See all Firebase Authentication users

## 🚀 Next Steps

1. Add search/filter for users
2. Add role assignment UI
3. Add bulk actions (enable/disable multiple users)
4. Add user creation form
5. Add detailed user profile view

---

**Status:** ✅ Backend fully integrated with Firebase Authentication!

The admin dashboard can now access, filter, and manage all Firebase users.
