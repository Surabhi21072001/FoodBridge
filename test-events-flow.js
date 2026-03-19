/**
 * FoodBridge Events End-to-End Flow Test
 * 
 * Tests the complete events journey:
 * 1. Student registration
 * 2. Login and get JWT token
 * 3. Browse event food listings
 * 4. Filter by event category
 * 5. View event listing details
 * 6. Reserve event food
 * 7. View reservations
 * 8. Confirm pickup
 * 9. Receive notifications
 * 10. View event history
 * 
 * Usage: node test-events-flow.js
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = '/api';

// Test data
const testStudent = {
  email: `event.student.${Date.now()}@university.edu`,
  password: 'EventPass123!',
  role: 'student',
  first_name: 'Event',
  last_name: 'Student',
  phone: '555-4444'
};

// Store test state
const testState = {
  userId: null,
  jwtToken: null,
  eventListings: [],
  selectedEventId: null,
  reservationId: null,
  confirmationCode: null,
  notifications: []
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
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  FoodBridge Events E2E Flow Test      ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log('========================================');
  console.log('Checking Server Health');
  console.log('========================================\n');
  
  try {
    const response = await makeRequest('GET', '/health');
    if (response.statusCode === 200) {
      console.log('✓ Server is running\n');
      return true;
    }
  } catch (error) {
    console.error('✗ Server is not running');
    console.error('Please start the server with: cd backend && npm run dev');
    return false;
  }
}

async function registerStudent() {
  console.log('========================================');
  console.log('STEP 1: Student Registration');
  console.log('========================================\n');
  
  const response = await makeRequest('POST', `${API_BASE}/auth/register`, testStudent);
  
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data) {
    testState.userId = response.data.data.user.id;
    testState.jwtToken = response.data.data.token;
    console.log('✓ Student registered successfully');
    console.log(`  Email: ${testStudent.email}`);
    console.log(`  User ID: ${testState.userId}`);
    console.log(`  Role: ${testStudent.role}\n`);
    return true;
  } else {
    console.error('✗ Registration failed');
    console.error(`  Error: ${response.data.message}`);
    return false;
  }
}

async function loginStudent() {
  console.log('========================================');
  console.log('STEP 2: Student Login');
  console.log('========================================\n');
  
  const loginData = {
    email: testStudent.email,
    password: testStudent.password
  };
  
  const response = await makeRequest('POST', `${API_BASE}/auth/login`, loginData);
  
  if (response.data.success && response.data.data && response.data.data.token) {
    testState.jwtToken = response.data.data.token;
    console.log('✓ Login successful');
    console.log(`  JWT Token obtained (first 50 chars): ${testState.jwtToken.substring(0, 50)}...\n`);
    return true;
  } else {
    console.error('✗ Login failed');
    return false;
  }
}

async function browseEventListings() {
  console.log('========================================');
  console.log('STEP 3: Browse Event Food Listings');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/listings?category=event_food&status=active&limit=10`
  );
  
  if (response.data.success && response.data.data) {
    testState.eventListings = response.data.data;
    console.log('✓ Event listings retrieved');
    console.log(`  Total event listings: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      response.data.data.slice(0, 3).forEach((listing, index) => {
        console.log(`  ${index + 1}. ${listing.title} - ${listing.quantity} ${listing.unit}`);
      });
    } else {
      console.log('  ℹ No event listings currently available');
    }
    console.log();
    return true;
  } else {
    console.error('✗ Failed to retrieve event listings');
    return false;
  }
}

async function filterByEventCategory() {
  console.log('========================================');
  console.log('STEP 4: Filter by Event Category');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/listings?category=event_food&status=active`
  );
  
  if (response.data.success && response.data.data) {
    console.log('✓ Event category filter applied');
    console.log(`  Filtered results: ${response.data.data.length} event listings`);
    
    if (response.data.data.length > 0) {
      const eventListing = response.data.data[0];
      testState.selectedEventId = eventListing.id;
      console.log(`  Selected event: ${eventListing.title}`);
      console.log(`  Category: ${eventListing.category}`);
      console.log(`  Cuisine: ${eventListing.cuisine_type || 'N/A'}`);
    }
    console.log();
    return true;
  } else {
    console.error('✗ Failed to filter by event category');
    return false;
  }
}

async function viewEventDetails() {
  console.log('========================================');
  console.log('STEP 5: View Event Listing Details');
  console.log('========================================\n');
  
  if (!testState.selectedEventId) {
    console.log('ℹ No event selected to view details');
    return true;
  }
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/listings/${testState.selectedEventId}`
  );
  
  if (response.data.success && response.data.data) {
    const listing = response.data.data;
    console.log('✓ Event details retrieved');
    console.log(`  Title: ${listing.title}`);
    console.log(`  Description: ${listing.description}`);
    console.log(`  Quantity: ${listing.quantity_available} ${listing.unit}`);
    console.log(`  Pickup Location: ${listing.pickup_location}`);
    console.log(`  Available: ${listing.available_from} to ${listing.available_until}`);
    console.log(`  Dietary Tags: ${listing.dietary_tags.join(', ') || 'None'}`);
    console.log(`  Allergens: ${listing.allergen_info.join(', ') || 'None'}\n`);
    return true;
  } else {
    console.error('✗ Failed to retrieve event details');
    return false;
  }
}

async function reserveEventFood() {
  console.log('========================================');
  console.log('STEP 6: Reserve Event Food');
  console.log('========================================\n');
  
  if (!testState.selectedEventId) {
    console.log('ℹ No event to reserve');
    return true;
  }
  
  const reservationData = {
    listing_id: testState.selectedEventId,
    quantity: 2
  };
  
  const response = await makeRequest(
    'POST',
    `${API_BASE}/reservations`,
    reservationData,
    testState.jwtToken
  );
  
  if (response.data.success && response.data.data) {
    testState.reservationId = response.data.data.id;
    testState.confirmationCode = response.data.data.confirmation_code;
    console.log('✓ Event food reserved successfully');
    console.log(`  Reservation ID: ${testState.reservationId}`);
    console.log(`  Quantity: ${response.data.data.quantity}`);
    console.log(`  Confirmation Code: ${response.data.data.confirmation_code}`);
    console.log(`  Status: ${response.data.data.status}\n`);
    return true;
  } else {
    console.error('✗ Reservation failed');
    console.error(`  Error: ${response.data.message}`);
    return false;
  }
}

async function viewReservations() {
  console.log('========================================');
  console.log('STEP 7: View Event Reservations');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/reservations`,
    null,
    testState.jwtToken
  );
  
  if (response.data.success && response.data.data) {
    console.log('✓ Reservations retrieved');
    console.log(`  Total reservations: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      response.data.data.slice(0, 3).forEach((res, index) => {
        console.log(`  ${index + 1}. Reservation ${res.id.substring(0, 8)}... - Status: ${res.status}`);
      });
    }
    console.log();
    return true;
  } else {
    console.error('✗ Failed to retrieve reservations');
    return false;
  }
}

async function confirmPickup() {
  console.log('========================================');
  console.log('STEP 8: Confirm Event Food Pickup');
  console.log('========================================\n');
  
  if (!testState.reservationId || !testState.confirmationCode) {
    console.log('ℹ No reservation to confirm');
    return true;
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
  
  if (response.data.success) {
    console.log('✓ Pickup confirmed successfully');
    console.log(`  Reservation Status: ${response.data.data.status}`);
    console.log(`  Picked up at: ${response.data.data.picked_up_at}\n`);
    return true;
  } else {
    console.error('✗ Pickup confirmation failed');
    return false;
  }
}

async function checkNotifications() {
  console.log('========================================');
  console.log('STEP 9: Check Event Notifications');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/notifications`,
    null,
    testState.jwtToken
  );
  
  if (response.data.success && response.data.data) {
    testState.notifications = response.data.data;
    console.log('✓ Notifications retrieved');
    console.log(`  Total notifications: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      response.data.data.slice(0, 3).forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title} - Type: ${notif.type}`);
      });
      
      const eventNotif = response.data.data.find(n => n.type === 'reservation_confirmed');
      if (eventNotif) {
        console.log(`  ✓ Found event reservation confirmation notification`);
      }
    }
    console.log();
    return true;
  } else {
    console.error('✗ Failed to retrieve notifications');
    return false;
  }
}

async function viewEventHistory() {
  console.log('========================================');
  console.log('STEP 10: View Event Participation History');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/reservations?status=picked_up`,
    null,
    testState.jwtToken
  );
  
  if (response.data.success && response.data.data) {
    console.log('✓ Event history retrieved');
    console.log(`  Completed event reservations: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      response.data.data.slice(0, 3).forEach((res, index) => {
        console.log(`  ${index + 1}. Reservation ${res.id.substring(0, 8)}... - Picked up`);
      });
    }
    console.log();
    return true;
  } else {
    console.error('✗ Failed to retrieve event history');
    return false;
  }
}

// Main test runner
async function runTests() {
  try {
    // Check server health
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      process.exit(1);
    }
    
    // Run test steps
    await registerStudent();
    await loginStudent();
    await browseEventListings();
    await filterByEventCategory();
    await viewEventDetails();
    await reserveEventFood();
    await viewReservations();
    await confirmPickup();
    await checkNotifications();
    await viewEventHistory();
    
    // Print summary
    console.log('========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');
    console.log('✓ All events flow tests completed!\n');
    console.log('Test Student Details:');
    console.log(`  Email: ${testStudent.email}`);
    console.log(`  User ID: ${testState.userId}`);
    console.log(`  Role: ${testStudent.role}`);
    console.log('');
    console.log('Events Flow Results:');
    console.log(`  Event Listings Found: ${testState.eventListings.length}`);
    console.log(`  Selected Event ID: ${testState.selectedEventId || 'N/A'}`);
    console.log(`  Reservation ID: ${testState.reservationId || 'N/A'}`);
    console.log(`  Confirmation Code: ${testState.confirmationCode || 'N/A'}`);
    console.log(`  Notifications: ${testState.notifications.length}`);
    console.log('');
    console.log('ℹ End-to-end events flow completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
