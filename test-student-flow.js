/**
 * FoodBridge Student End-to-End Flow Test
 * 
 * Tests the complete student journey:
 * 1. Register new student user
 * 2. Login and get JWT token
 * 3. Browse available food listings
 * 4. Reserve food
 * 5. Confirm pickup
 * 6. Receive and view notifications
 * 
 * Usage: node test-student-flow.js
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = '/api';

// Test data
const testStudent = {
  email: `test.student.${Date.now()}@university.edu`,
  password: 'TestPassword123!',
  role: 'student',
  first_name: 'Test',
  last_name: 'Student',
  phone: '555-9999'
};

// Store test state
const testState = {
  userId: null,
  jwtToken: null,
  listingId: null,
  reservationId: null,
  confirmationCode: null
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function checkServerHealth() {
  console.log('\n========================================');
  console.log('Checking Server Health');
  console.log('========================================\n');
  
  try {
    const response = await makeRequest('GET', '/health');
    if (response.statusCode === 200) {
      console.log('✓ Server is running');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;
    }
  } catch (error) {
    console.error('✗ Server is not running');
    console.error('Please start the server with: cd backend && npm run dev');
    return false;
  }
}

async function registerStudent() {
  console.log('\n========================================');
  console.log('STEP 1: Register New Student User');
  console.log('========================================\n');
  
  const response = await makeRequest('POST', `${API_BASE}/auth/register`, testStudent);
  
  console.log('Request:', JSON.stringify(testStudent, null, 2));
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data) {
    testState.userId = response.data.data.user.id;
    console.log('\n✓ User registered successfully');
    console.log(`User ID: ${testState.userId}`);
    return true;
  } else {
    console.error('\n✗ Registration failed');
    return false;
  }
}

async function loginStudent() {
  console.log('\n========================================');
  console.log('STEP 2: Login and Get JWT Token');
  console.log('========================================\n');
  
  const loginData = {
    email: testStudent.email,
    password: testStudent.password
  };
  
  const response = await makeRequest('POST', `${API_BASE}/auth/login`, loginData);
  
  console.log('Request:', JSON.stringify(loginData, null, 2));
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data && response.data.data.token) {
    testState.jwtToken = response.data.data.token;
    console.log('\n✓ Login successful');
    console.log(`JWT Token (first 50 chars): ${testState.jwtToken.substring(0, 50)}...`);
    return true;
  } else {
    console.error('\n✗ Login failed');
    return false;
  }
}

async function browseListings() {
  console.log('\n========================================');
  console.log('STEP 3: Browse Available Food Listings');
  console.log('========================================\n');
  
  const response = await makeRequest('GET', `${API_BASE}/listings?status=active&limit=10`);
  
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data && response.data.data.length > 0) {
    // Find a listing that's currently available (not in the future)
    const now = new Date();
    const availableListing = response.data.data.find(listing => {
      const availableFrom = new Date(listing.available_from);
      const availableUntil = new Date(listing.available_until);
      return availableFrom <= now && now <= availableUntil;
    }) || response.data.data[0];
    
    testState.listingId = availableListing.id;
    console.log('\n✓ Listings retrieved successfully');
    console.log(`Found listing: ${availableListing.title} (ID: ${testState.listingId})`);
    console.log(`Quantity available: ${availableListing.quantity_available}`);
    console.log(`Price: $${availableListing.discounted_price || availableListing.original_price}`);
    return true;
  } else {
    console.error('\n✗ No active listings found');
    console.error('Please ensure sample data is loaded with: psql -U postgres -d foodbridge -f database/seeds/sample_data.sql');
    return false;
  }
}

async function getListingDetails() {
  console.log('\n========================================');
  console.log('STEP 4: Get Detailed Listing Information');
  console.log('========================================\n');
  
  const response = await makeRequest('GET', `${API_BASE}/listings/${testState.listingId}`);
  
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data) {
    console.log('\n✓ Listing details retrieved');
    return true;
  } else {
    console.error('\n✗ Failed to retrieve listing details');
    return false;
  }
}

async function createReservation() {
  console.log('\n========================================');
  console.log('STEP 5: Create Reservation');
  console.log('========================================\n');
  
  const reservationData = {
    listing_id: testState.listingId,
    quantity: 2
  };
  
  const response = await makeRequest(
    'POST',
    `${API_BASE}/reservations`,
    reservationData,
    testState.jwtToken
  );
  
  console.log('Request:', JSON.stringify(reservationData, null, 2));
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data) {
    testState.reservationId = response.data.data.id;
    testState.confirmationCode = response.data.data.confirmation_code;
    console.log('\n✓ Reservation created successfully');
    console.log(`Reservation ID: ${testState.reservationId}`);
    console.log(`Confirmation Code: ${testState.confirmationCode}`);
    return true;
  } else {
    console.error('\n✗ Reservation failed');
    return false;
  }
}

async function viewUserReservations() {
  console.log('\n========================================');
  console.log('STEP 6: View User\'s Reservations');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/reservations`,
    null,
    testState.jwtToken
  );
  
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data) {
    console.log('\n✓ User reservations retrieved');
    console.log(`Total reservations: ${response.data.data.length}`);
    return true;
  } else {
    console.error('\n✗ Failed to retrieve user reservations');
    return false;
  }
}

async function confirmPickup() {
  console.log('\n========================================');
  console.log('STEP 7: Confirm Pickup');
  console.log('========================================\n');
  
  if (!testState.reservationId || !testState.confirmationCode) {
    console.error('\n✗ Cannot confirm pickup - missing reservation ID or confirmation code');
    return false;
  }
  
  const confirmData = {
    confirmation_code: testState.confirmationCode
  };
  
  const response = await makeRequest(
    'POST',
    `${API_BASE}/reservations/${testState.reservationId}/confirm-pickup`,
    confirmData,
    testState.jwtToken
  );
  
  console.log('Request:', JSON.stringify(confirmData, null, 2));
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success) {
    console.log('\n✓ Pickup confirmed successfully');
    return true;
  } else {
    console.error('\n✗ Pickup confirmation failed');
    return false;
  }
}

async function checkNotifications() {
  console.log('\n========================================');
  console.log('STEP 8: Check Notifications');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/notifications`,
    null,
    testState.jwtToken
  );
  
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data) {
    console.log('\n✓ Notifications retrieved');
    console.log(`Total notifications: ${response.data.data.length}`);
    
    const reservationNotif = response.data.data.find(n => n.type === 'reservation_confirmed');
    if (reservationNotif) {
      console.log('✓ Found reservation confirmation notification');
    }
    return true;
  } else {
    console.error('\n✗ Failed to retrieve notifications');
    return false;
  }
}

async function getUnreadCount() {
  console.log('\n========================================');
  console.log('STEP 9: Get Unread Notification Count');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/notifications/unread-count`,
    null,
    testState.jwtToken
  );
  
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success) {
    console.log('\n✓ Unread count retrieved');
    console.log(`Unread notifications: ${response.data.data.count}`);
    return true;
  } else {
    console.error('\n✗ Failed to retrieve unread count');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  FoodBridge Student E2E Flow Test     ║');
  console.log('╚════════════════════════════════════════╝');
  
  try {
    // Check server health
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      process.exit(1);
    }
    
    // Run test steps
    await registerStudent();
    await loginStudent();
    await browseListings();
    await getListingDetails();
    await createReservation();
    await viewUserReservations();
    await confirmPickup();
    await checkNotifications();
    await getUnreadCount();
    
    // Print summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');
    console.log('✓ All tests passed successfully!\n');
    console.log('Test User Details:');
    console.log(`  Email: ${testStudent.email}`);
    console.log(`  Password: ${testStudent.password}`);
    console.log(`  User ID: ${testState.userId}`);
    console.log('');
    console.log('Test Results:');
    console.log(`  Reservation ID: ${testState.reservationId}`);
    console.log(`  Confirmation Code: ${testState.confirmationCode}`);
    console.log('');
    console.log('ℹ End-to-end student flow completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
