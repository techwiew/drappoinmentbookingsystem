import fetch from 'node-fetch';
import fs from 'fs';

async function runFullAudit() {
  console.log('🚀 STARTING FULL END-TO-END SYSTEM AUDIT...');
  const results = [];

  const logTest = (name, action, result, status) => {
    results.push({ name, action, result, status });
    console.log(`[${status}] ${name}: ${action}`);
  };

  try {
    // 1. AUTHENTICATION TESTS
    console.log('\n--- Testing Auth ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@medinodes.com', password: 'SuperAdmin@123' })
    });
    const loginData = await loginRes.json();
    
    if (loginData.success) {
      logTest('Admin Login', 'Login with superadmin', 'Token obtained', 'PASS');
      const token = loginData.data.accessToken;

      // 2. PATIENT MANAGEMENT (Receptionist Flow)
      console.log('\n--- Testing Patient & Appointment Flow ---');
      const patientRes = await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          clinicId: 'demo-clinic-id', // This would normally be dynamic
          patientNumber: 'P-TEST-101',
          fullName: 'Test Patient',
          gender: 'MALE',
          mobile: '9876543210'
        })
      });
      const patientData = await patientRes.json();
      
      if (patientData.success) {
        logTest('Patient Creation', 'Register new patient', 'Patient created', 'PASS');
        
        // 3. APPOINTMENT BOOKING
        const apptRes = await fetch('http://localhost:5000/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            clinicId: 'demo-clinic-id',
            patientId: patientData.data.id,
            doctorId: 'doc-123',
            appointmentDate: new Date().toISOString().split('T')[0],
            appointmentTime: '10:00 AM',
            appointmentType: 'NEW_PATIENT'
          })
        });
        const apptData = await apptRes.json();
        if (apptData.success) {
          logTest('Booking', 'Book appointment', 'Appointment scheduled', 'PASS');
        } else {
          logTest('Booking', 'Book appointment', apptData.error?.message || 'Failed', 'FAIL');
        }
      } else {
        logTest('Patient Creation', 'Register new patient', patientData.error?.message || 'Failed', 'FAIL');
      }

      // 4. CONSULTATION & PRESCRIPTION (Doctor Flow)
      console.log('\n--- Testing Doctor Workflow ---');
      const consultRes = await fetch('http://localhost:5000/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          clinicId: 'demo-clinic-id',
          appointmentId: 'appt-123',
          patientId: 'pat-123',
          doctorId: 'doc-123',
          chiefComplaint: 'Seasonal Fever',
          diagnosis: 'Common Cold',
          advice: 'Rest and hydrate'
        })
      });
      const consultData = await consultRes.json();
      if (consultData.success) {
        logTest('Consultation', 'Record diagnosis', 'Consultation saved', 'PASS');
      } else {
        logTest('Consultation', 'Record diagnosis', consultData.error?.message || 'Failed', 'FAIL');
      }

    } else {
      logTest('Admin Login', 'Login with superadmin', 'Failed credentials', 'FAIL');
    }

  } catch (err) {
    console.error('🚨 Fatal Test Error:', err);
  }

  // Write results to a file for the user
  fs.writeFileSync('audit_report.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Audit Complete. Results saved to audit_report.json');
}

runFullAudit();
