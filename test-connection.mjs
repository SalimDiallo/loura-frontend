/**
 * Script de test de connexion frontend → backend
 *
 * Usage: node test-connection.mjs
 */

const API_URL = 'http://localhost:8000/api';

async function testRegister() {
  console.log('\n🔵 Test: Register');
  console.log('-------------------');

  const response = await fetch(`${API_URL}/auth/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: `test${Date.now()}@loura.com`,
      password: 'TestPass123!',
      password_confirm: 'TestPass123!',
      first_name: 'Test',
      last_name: 'User',
    }),
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, text);

  try {
    const data = JSON.parse(text);
    if (response.ok) {
      console.log('✅ Register successful!');
      // Backend retourne { message, data: { user, access, refresh } }
      return data.data || data;
    } else {
      console.log('❌ Register failed:', data);
      return null;
    }
  } catch (e) {
    console.log('❌ Invalid JSON response');
    return null;
  }
}

async function testLogin(email, password) {
  console.log('\n🔵 Test: Login');
  console.log('-------------------');

  const response = await fetch(`${API_URL}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);

  try {
    const data = JSON.parse(text);
    const responseData = data.data || data;
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User:', responseData.user?.email);
      console.log('Access token:', responseData.access?.substring(0, 20) + '...');
      return responseData;
    } else {
      console.log('❌ Login failed:', data);
      return null;
    }
  } catch (e) {
    console.log('❌ Invalid JSON response:', text);
    return null;
  }
}

async function testCurrentUser(accessToken) {
  console.log('\n🔵 Test: Current User');
  console.log('-------------------');

  const response = await fetch(`${API_URL}/auth/me/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);

  try {
    const data = JSON.parse(text);
    if (response.ok) {
      console.log('✅ Current user fetched!');
      console.log('User:', data);
      return data;
    } else {
      console.log('❌ Fetch failed:', data);
      return null;
    }
  } catch (e) {
    console.log('❌ Invalid JSON response:', text);
    return null;
  }
}

async function testLogout(refreshToken, accessToken) {
  console.log('\n🔵 Test: Logout');
  console.log('-------------------');

  const response = await fetch(`${API_URL}/auth/logout/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);

  try {
    const data = JSON.parse(text);
    if (response.ok) {
      console.log('✅ Logout successful!');
      return data;
    } else {
      console.log('❌ Logout failed:', data);
      return null;
    }
  } catch (e) {
    console.log('✅ Logout successful (empty response)');
    return true;
  }
}

async function main() {
  console.log('🚀 Testing Frontend ↔ Backend Connection');
  console.log('=========================================');
  console.log(`API URL: ${API_URL}`);

  // Test 1: Register
  const registerData = await testRegister();
  if (!registerData) {
    console.log('\n❌ Cannot proceed without registration');
    return;
  }

  // Test 2: Login with registered user
  await new Promise(resolve => setTimeout(resolve, 500));
  const loginData = await testLogin(registerData.user.email, 'TestPass123!');
  if (!loginData) {
    console.log('\n❌ Cannot proceed without login');
    return;
  }

  // Test 3: Get current user
  await new Promise(resolve => setTimeout(resolve, 500));
  await testCurrentUser(loginData.access);

  // Test 4: Logout
  await new Promise(resolve => setTimeout(resolve, 500));
  await testLogout(loginData.refresh, loginData.access);

  console.log('\n✅ All tests completed!');
  console.log('=========================================');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
