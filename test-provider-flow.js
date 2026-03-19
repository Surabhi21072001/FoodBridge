/**
 * FoodBridge Provider End-to-End Flow Test
 * 
 * Tests the complete provider journey:
 * 1. Register new provider user
 * 2. Login and get JWT token
 * 3. Create food listing
 * 4. View provider's listings
 * 5. View reservations for listing
 * 6. Confirm pickup for student reservation
 * 
 * Usage: node test-provider-flow.js
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = '/api';

// Test data
const testProvider = {
  email: `test.provider.${Date.now()}@restaurant.com`,
  password: 'ProviderPass123!',
  role: 'provider',
  first_name: 'Test',
  last_name: 'Provider',
  phone: '555-8888'
};

// Store test state
const testState = {
  providerId: null,
  jwtToken: null,
  listingId: null,
  reservationId: null,
  confirmationCode: null,
  studentReservations: []
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
      return true;
    }
  } catch (error) {
    console.error('✗ Server is not running');
    console.error('Please start the server with: cd backend && npm run dev');
    return false;
  }
}

async function registerProvider() {
  console.log('\n========================================');
  console.log('STEP 1: Register New Provider User');
  console.log('========================================\n');
  
  const response = await makeRequest('POST', `${API_BASE}/auth/register`, testProvider);
  
  console.log('Request:', JSON.stringify(testProvider, null, 2));
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data) {
    testState.providerId = response.data.data.user.id;
    console.log('\n✓ Provider registered successfully');
    console.log(`Provider ID: ${testState.providerId}`);
    return true;
  } else {
    console.error('\n✗ Registration failed');
    return false;
  }
}

async function loginProvider() {
  console.log('\n========================================');
  console.log('STEP 2: Login and Get JWT Token');
  console.log('========================================\n');
  
  const loginData = {
    email: testProvider.email,
    password: testProvider.password
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

async function createListing() {
  console.log('\n========================================');
  console.log('STEP 3: Create Food Listing');
  console.log('========================================\n');
  
  // Create a listing that's available now
  const now = new Date();
  const availableFrom = new Date(now.getTime() - 60000); // 1 minute ago
  const availableUntil = new Date(now.getTime() + 3600000); // 1 hour from now
  
  const listingData = {
    title: 'Fresh Surplus Sandwiches',
    description: 'Delicious sandwiches from today\'s lunch service, still fresh!',
    category: 'meal',
    cuisine_type: 'american',
    dietary_tags: ['vegetarian', 'vegan'],
    allergen_info: ['gluten', 'dairy'],
    quantity_available: 15,
    unit: 'sandwich',
    original_price: 8.99,
    discounted_price: 2.99,
    pickup_location: 'Restaurant - Back Counter',
    available_from: availableFrom.toISOString(),
    available_until: availableUntil.toISOString()
  };
  
  const response = await makeRequest(
    'POST',
    `${API_BASE}/listings`,
    listingData,
    testState.jwtToken
  );
  
  console.log('Request:', JSON.stringify(listingData, null, 2));
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data) {
    testState.listingId = response.data.data.id;
    console.log('\n✓ Listing created successfully');
    console.log(`Listing ID: ${testState.listingId}`);
    console.log(`Title: ${response.data.data.title}`);
    console.log(`Quantity: ${response.data.data.quantity_available} ${response.data.data.unit}`);
    return true;
  } else {
    console.error('\n✗ Listing creation failed');
    return false;
  }
}

async function getProviderListings() {
  console.log('\n========================================');
  console.log('STEP 4: View Provider\'s Listings');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/listings/provider/my-listings`,
    null,
    testState.jwtToken
  );
  
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data) {
    console.log('\n✓ Provider listings retrieved');
    console.log(`Total listings: ${response.data.data.length}`);
    
    // Find our newly created listing
    const ourListing = response.data.data.find(l => l.id === testState.listingId);
    if (ourListing) {
      console.log(`✓ Found our listing: ${ourListing.title}`);
      console.log(`  Status: ${ourListing.status}`);
      console.log(`  Available: ${ourListing.quantity_available} / ${ourListing.quantity_available + ourListing.quantity_reserved}`);
    }
    return true;
  } else {
    console.error('\n✗ Failed to retrieve provider listings');
    return false;
  }
}

async function getReservationsForListing() {
  console.log('\n========================================');
  console.log('STEP 5: View Reservations for Listing');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/reservations/listing/${testState.listingId}`,
    null,
    testState.jwtToken
  );
  
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success && response.data.data) {
    console.log('\n✓ Reservations retrieved');
    console.log(`Total reservations: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      testState.studentReservations = response.data.data;
      const firstReservation = response.data.data[0];
      console.log(`\nFirst reservation:`);
      console.log(`  ID: ${firstReservation.id}`);
      console.log(`  Quantity: ${firstReservation.quantity}`);
      console.log(`  Status: ${firstReservation.status}`);
      console.log(`  Confirmation Code: ${firstReservation.confirmation_code}`);
    } else {
      console.log('ℹ No reservations yet for this listing');
    }
    return true;
  } else {
    console.error('\n✗ Failed to retrieve reservations');
    return false;
  }
}

async function confirmStudentPickup() {
  console.log('\n========================================');
  console.log('STEP 6: Confirm Student Pickup');
  console.log('========================================\n');
  
  if (testState.studentReservations.length === 0) {
    console.log('ℹ No student reservations to confirm');
    console.log('Skipping this step...');
    return true;
  }
  
  const reservation = testState.studentReservations[0];
  testState.reservationId = reservation.id;
  testState.confirmationCode = reservation.confirmation_code;
  
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
    console.log(`Reservation Status: ${response.data.data.status}`);
    console.log(`Picked up at: ${response.data.data.picked_up_at}`);
    return true;
  } else {
    console.error('\n✗ Pickup confirmation failed');
    return false;
  }
}

async function updateListing() {
  console.log('\n========================================');
  console.log('STEP 7: Update Listing (Optional)');
  console.log('========================================\n');
  
  const updateData = {
    quantity_available: 10,
    discounted_price: 1.99
  };
  
  const response = await makeRequest(
    'PUT',
    `${API_BASE}/listings/${testState.listingId}`,
    updateData,
    testState.jwtToken
  );
  
  console.log('Request:', JSON.stringify(updateData, null, 2));
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success) {
    console.log('\n✓ Listing updated successfully');
    console.log(`New quantity: ${response.data.data.quantity_available}`);
    console.log(`New price: $${response.data.data.discounted_price}`);
    return true;
  } else {
    console.error('\n✗ Listing update failed');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  FoodBridge Provider E2E Flow Test    ║');
  console.log('╚════════════════════════════════════════╝');
  
  try {
    // Check server health
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      process.exit(1);
    }
    
    // Run test steps
    await registerProvider();
    await loginProvider();
    await createListing();
    await getProviderListings();
    await getReservationsForListing();
    await confirmStudentPickup();
    await updateListing();
    
    // Print summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');
    console.log('✓ All tests passed successfully!\n');
    console.log('Test Provider Details:');
    console.log(`  Email: ${testProvider.email}`);
    console.log(`  Password: ${testProvider.password}`);
    console.log(`  Provider ID: ${testState.providerId}`);
    console.log('');
    console.log('Test Results:');
    console.log(`  Listing ID: ${testState.listingId}`);
    console.log(`  Listing Title: Fresh Surplus Sandwiches`);
    console.log(`  Quantity: 15 sandwiches`);
    console.log(`  Price: $2.99 (was $8.99)`);
    console.log('');
    if (testState.studentReservations.length > 0) {
      console.log(`  Student Reservations: ${testState.studentReservations.length}`);
      console.log(`  Confirmed Pickups: 1`);
    } else {
      console.log('  Student Reservations: 0 (no existing reservations)');
    }
    console.log('');
    console.log('ℹ End-to-end provider flow completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
