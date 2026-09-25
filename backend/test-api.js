import fetch from 'node-fetch';

async function test() {
  const password = process.env.TEST_SUPER_ADMIN_PASSWORD;
  if (!password) throw new Error('Missing required environment variable: TEST_SUPER_ADMIN_PASSWORD');
  try {
    console.log('🚀 Starting End-to-End API Tests...');
    
    // 1. Test Login
    console.log('\n--- Step 1: Testing Super Admin Login ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@medinovel.com',
        password
      })
    });
    const loginData = await loginRes.json();
    console.log('Login response received');
    
    if (!loginData.success || !loginData.data?.accessToken) {
      console.log('❌ Login failed. Stopping tests.');
      return;
    }
    
    const token = loginData.data.accessToken;
    console.log('✅ Login Successful! Token obtained.');

    // 2. Test Health Check (Authorized)
    console.log('\n--- Step 2: Testing Authorized Health Check ---');
    const healthRes = await fetch('http://localhost:5000/api/health', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const healthData = await healthRes.json();
    console.log('Health response received');
    
    if (healthData.success) {
      console.log('✅ Health check passed.');
    } else {
      console.log('❌ Health check failed.');
    }

  } catch (err) {
    console.error('🚨 Error during testing');
  }
}

test();
