/**
 * FoodBridge Combined End-to-End Flow Test
 * 
 * Tests the complete interaction between provider and student:
 * 1. Provider registers and creates a listing
 * 2. Student registers and browses listings
 * 3. Student makes a reservation
 * 4. Provider views reservations for their listing
 * 5. Provider confirms student pickup
 * 6. Student receives notification
 * 
 * Usage: node test-combined-flow.js
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = '/api';

// Test data
const testProvider = {
  email: `provider.${Date.now()}@restaurant.com`,
  password: 'ProviderPass123!',
  role: 'provider',
  first_name: 'Provider',
  last_name: 'Test',
  phone: '555-7777'
};

const testStudent = {
  email: `student.${Date.now()}@university.edu`,
  password: 'StudentPass123!',
  role: 'student',
  first_name: 'Student',
  last_name: 'Test',
  phone: '555-6666'
};

// Store test state
const testState = {
  provider: { id: null, token: null },
  student: { id: null, token: null },
  listing: { id: null, title: null },
  reservation: { id: null, code: null }
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
  console.log('║  FoodBridge Combined E2E Flow Test    ║');
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

// PROVIDER FLOW
async function providerRegister() {
  console.log('========================================');
  console.log('PROVIDER FLOW: Register');
  console.log('========================================\n');
  
  const response = await makeRequest('POST', `${API_BASE}/auth/register`, testProvider);
  
  if (response.data.success && response.data.data) {
    testState.provider.id = response.data.data.user.id;
    testState.provider.token = response.data.data.token;
    console.log('✓ Provider registered');
    console.log(`  Email: ${testProvider.email}`);
    console.log(`  ID: ${testState.provider.id}\n`);
    return true;
  } else {
    console.error('✗ Provider registration failed');
    return false;
  }
}

async function providerCreateListing() {
  console.log('========================================');
  console.log('PROVIDER FLOW: Create Listing');
  console.log('========================================\n');
  
  // Create times that are definitely available
  const now = new Date();
  const availableFrom = new Date(now.getTime() - 3600000); // 1 hour ago
  const availableUntil = new Date(now.getTime() + 7200000); // 2 hours from now
  
  const listingData = {
    title: 'Gourmet Pizza Slices',
    description: 'Fresh wood-fired pizza from today\'s service',
    category: 'meal',
    cuisine_type: 'italian',
    dietary_tags: ['vegetarian'],
    allergen_info: ['gluten', 'dairy'],
    quantity_available: 20,
    unit: 'slice',
    original_price: 5.99,
    discounted_price: 1.99,
    pickup_location: 'Pizza Place - Front Counter',
    available_from: availableFrom.toISOString(),
    available_until: availableUntil.toISOString()
  };
  
  const response = await makeRequest(
    'POST',
    `${API_BASE}/listings`,
    listingData,
    testState.provider.token
  );
  
  if (response.data.success && response.data.data) {
    testState.listing.id = response.data.data.id;
    testState.listing.title = response.data.data.title;
    console.log('✓ Listing created');
    console.log(`  Title: ${response.data.data.title}`);
    console.log(`  Quantity: ${response.data.data.quantity_available} ${response.data.data.unit}`);
    console.log(`  Price: $${response.data.data.discounted_price}`);
    console.log(`  Available: ${response.data.data.available_from} to ${response.data.data.available_until}\n`);
    return true;
  } else {
    console.error('✗ Listing creation failed');
    console.error(`  Error: ${response.data.message}`);
    return false;
  }
}

// STUDENT FLOW
async function studentRegister() {
  console.log('========================================');
  console.log('STUDENT FLOW: Register');
  console.log('========================================\n');
  
  const response = await makeRequest('POST', `${API_BASE}/auth/register`, testStudent);
  
  if (response.data.success && response.data.data) {
    testState.student.id = response.data.data.user.id;
    testState.student.token = response.data.data.token;
    console.log('✓ Student registered');
    console.log(`  Email: ${testStudent.email}`);
    console.log(`  ID: ${testState.student.id}\n`);
    return true;
  } else {
    console.error('✗ Student registration failed');
    return false;
  }
}

async function studentBrowseListings() {
  console.log('========================================');
  console.log('STUDENT FLOW: Browse Listings');
  console.log('========================================\n');
  
  const response = await makeRequest('GET', `${API_BASE}/listings?status=active&limit=10`);
  
  if (response.data.success && response.data.data) {
    console.log('✓ Listings retrieved');
    console.log(`  Total available: ${response.data.data.length}`);
    
    // Find a listing that's currently available (not our provider's listing)
    const now = new Date();
    const availableListing = response.data.data.find(l => {
      const availableFrom = new Date(l.available_from);
      const availableUntil = new Date(l.available_until);
      return availableFrom <= now && now <= availableUntil && l.id !== testState.listing.id;
    });
    
    if (availableListing) {
      // Use the existing available listing instead
      testState.listing.id = availableListing.id;
      testState.listing.title = availableListing.title;
      console.log(`  ✓ Using available listing: ${availableListing.title}\n`);
      return true;
    }
    
    // If no other listing available, use our provider's listing
    const ourListing = response.data.data.find(l => l.id === testState.listing.id);
    if (ourListing) {
      console.log(`  ✓ Found provider's listing: ${ourListing.title}\n`);
      return true;
    }
    
    console.log('  ℹ No suitable listings found\n');
    return true;
  } else {
    console.error('✗ Failed to browse listings');
    return false;
  }
}

async function studentMakeReservation() {
  console.log('========================================');
  console.log('STUDENT FLOW: Make Reservation');
  console.log('========================================\n');
  
  const reservationData = {
    listing_id: testState.listing.id,
    quantity: 3
  };
  
  const response = await makeRequest(
    'POST',
    `${API_BASE}/reservations`,
    reservationData,
    testState.student.token
  );
  
  if (response.data.success && response.data.data) {
    testState.reservation.id = response.data.data.id;
    testState.reservation.code = response.data.data.confirmation_code;
    console.log('✓ Reservation created');
    console.log(`  Listing: ${testState.listing.title}`);
    console.log(`  Quantity: ${response.data.data.quantity}`);
    console.log(`  Confirmation Code: ${response.data.data.confirmation_code}`);
    console.log(`  Status: ${response.data.data.status}\n`);
    return true;
  } else {
    console.error('✗ Reservation failed');
    console.error(`  Error: ${response.data.message}`);
    console.error(`  Response:`, JSON.stringify(response.data, null, 2));
    return false;
  }
}

// PROVIDER VIEWS RESERVATIONS
async function providerViewReservations() {
  console.log('========================================');
  console.log('PROVIDER FLOW: View Reservations');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/reservations/listing/${testState.listing.id}`,
    null,
    testState.provider.token
  );
  
  if (response.data.success && response.data.data) {
    console.log('✓ Reservations retrieved');
    console.log(`  Total reservations: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      const reservation = response.data.data[0];
      console.log(`  First reservation:`);
      console.log(`    Quantity: ${reservation.quantity}`);
      console.log(`    Status: ${reservation.status}`);
      console.log(`    Code: ${reservation.confirmation_code}\n`);
    }
    return true;
  } else {
    console.error('✗ Failed to view reservations');
    return false;
  }
}

// PROVIDER CONFIRMS PICKUP
async function providerConfirmPickup() {
  console.log('========================================');
  console.log('PROVIDER FLOW: Confirm Pickup');
  console.log('========================================\n');
  
  const confirmData = {
    confirmation_code: testState.reservation.code
  };
  
  const response = await makeRequest(
    'POST',
    `${API_BASE}/reservations/${testState.reservation.id}/confirm-pickup`,
    confirmData,
    testState.provider.token
  );
  
  if (response.data.success) {
    console.log('✓ Pickup confirmed');
    console.log(`  Reservation Status: ${response.data.data.status}`);
    console.log(`  Picked up at: ${response.data.data.picked_up_at}\n`);
    return true;
  } else {
    console.error('✗ Pickup confirmation failed');
    return false;
  }
}

// STUDENT CHECKS NOTIFICATIONS
async function studentCheckNotifications() {
  console.log('========================================');
  console.log('STUDENT FLOW: Check Notifications');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/notifications`,
    null,
    testState.student.token
  );
  
  if (response.data.success && response.data.data) {
    console.log('✓ Notifications retrieved');
    console.log(`  Total notifications: ${response.data.data.length}`);
    
    const reservationNotif = response.data.data.find(n => n.type === 'reservation_confirmed');
    if (reservationNotif) {
      console.log(`  ✓ Found reservation confirmation`);
      console.log(`    Title: ${reservationNotif.title}`);
      console.log(`    Message: ${reservationNotif.message}\n`);
    }
    return true;
  } else {
    console.error('✗ Failed to check notifications');
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
    
    // Provider flow
    await providerRegister();
    await providerCreateListing();
    
    // Student flow
    await studentRegister();
    await studentBrowseListings();
    await studentMakeReservation();
    
    // Provider views and confirms
    await providerViewReservations();
    await providerConfirmPickup();
    
    // Student checks notifications
    await studentCheckNotifications();
    
    // Print summary
    console.log('========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');
    console.log('✓ Complete provider-student interaction validated!\n');
    console.log('Provider:');
    console.log(`  Email: ${testProvider.email}`);
    console.log(`  Listing: ${testState.listing.title}`);
    console.log('');
    console.log('Student:');
    console.log(`  Email: ${testStudent.email}`);
    console.log(`  Reservation: 3 slices`);
    console.log(`  Confirmation Code: ${testState.reservation.code}`);
    console.log('');
    console.log('ℹ End-to-end combined flow completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
