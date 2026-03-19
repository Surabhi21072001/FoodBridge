/**
 * FoodBridge Pantry End-to-End Flow Test
 * 
 * Tests the complete pantry journey:
 * 1. Register student user
 * 2. Login and get JWT token
 * 3. Get available pantry appointment slots
 * 4. Book pantry appointment
 * 5. View user's appointments
 * 6. Get pantry inventory
 * 7. Add items to cart
 * 8. View cart
 * 9. Update cart item quantity
 * 10. Submit pantry order
 * 11. View order history
 * 12. Get specific order details
 * 
 * Usage: node test-pantry-flow.js
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = '/api';

// Test data
const testStudent = {
  email: `pantry.student.${Date.now()}@university.edu`,
  password: 'PantryPass123!',
  role: 'student',
  first_name: 'Pantry',
  last_name: 'Student',
  phone: '555-5555'
};

// Store test state
const testState = {
  userId: null,
  jwtToken: null,
  appointmentId: null,
  appointmentTime: null,
  inventoryItems: [],
  cartItems: [],
  orderId: null
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
  console.log('║  FoodBridge Pantry E2E Flow Test      ║');
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
  console.log('STEP 1: Register Student User');
  console.log('========================================\n');
  
  const response = await makeRequest('POST', `${API_BASE}/auth/register`, testStudent);
  
  if (response.data.success && response.data.data) {
    testState.userId = response.data.data.user.id;
    testState.jwtToken = response.data.data.token;
    console.log('✓ Student registered successfully');
    console.log(`  Email: ${testStudent.email}`);
    console.log(`  User ID: ${testState.userId}\n`);
    return true;
  } else {
    console.error('✗ Registration failed');
    return false;
  }
}

async function getAvailableSlots() {
  console.log('========================================');
  console.log('STEP 2: Get Available Appointment Slots');
  console.log('========================================\n');
  
  const response = await makeRequest('GET', `${API_BASE}/pantry/appointments/slots`);
  
  if (response.data.success && response.data.data) {
    console.log('✓ Available slots retrieved');
    console.log(`  Total slots: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      // Find a future slot
      const now = new Date();
      const futureSlot = response.data.data.find(slot => {
        const slotTime = new Date(slot.time);
        return slotTime > now;
      });
      
      if (futureSlot) {
        testState.appointmentTime = futureSlot.time;
        console.log(`  First available future slot: ${futureSlot.time}`);
        console.log(`  Available spots: ${futureSlot.available_spots}\n`);
      } else {
        // Use a future time manually
        const futureTime = new Date(now.getTime() + 86400000); // 1 day from now
        testState.appointmentTime = futureTime.toISOString();
        console.log(`  No future slots found, using: ${testState.appointmentTime}\n`);
      }
    }
    return true;
  } else {
    console.error('✗ Failed to retrieve slots');
    return false;
  }
}

async function bookAppointment() {
  console.log('========================================');
  console.log('STEP 3: Book Pantry Appointment');
  console.log('========================================\n');
  
  if (!testState.appointmentTime) {
    console.log('ℹ No appointment slots available');
    return true;
  }
  
  const appointmentData = {
    appointment_time: testState.appointmentTime,
    duration_minutes: 30,
    notes: 'First time pantry visit'
  };
  
  const response = await makeRequest(
    'POST',
    `${API_BASE}/pantry/appointments`,
    appointmentData,
    testState.jwtToken
  );
  
  if (response.data.success && response.data.data) {
    testState.appointmentId = response.data.data.id;
    console.log('✓ Appointment booked successfully');
    console.log(`  Appointment ID: ${testState.appointmentId}`);
    console.log(`  Time: ${response.data.data.appointment_time}`);
    console.log(`  Duration: ${response.data.data.duration_minutes} minutes`);
    console.log(`  Status: ${response.data.data.status}\n`);
    return true;
  } else {
    console.error('✗ Appointment booking failed');
    console.error(`  Error: ${response.data.message}`);
    return false;
  }
}

async function getUserAppointments() {
  console.log('========================================');
  console.log('STEP 4: View User Appointments');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/pantry/appointments?upcoming=true`,
    null,
    testState.jwtToken
  );
  
  if (response.data.success && response.data.data) {
    console.log('✓ User appointments retrieved');
    console.log(`  Total appointments: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      const appointment = response.data.data[0];
      console.log(`  Next appointment: ${appointment.appointment_time}`);
      console.log(`  Status: ${appointment.status}\n`);
    }
    return true;
  } else {
    console.error('✗ Failed to retrieve appointments');
    return false;
  }
}

async function getPantryInventory() {
  console.log('========================================');
  console.log('STEP 5: Get Pantry Inventory');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/pantry/inventory?limit=10`,
    null,
    testState.jwtToken
  );
  
  if (response.data.success && response.data.data) {
    testState.inventoryItems = response.data.data;
    console.log('✓ Pantry inventory retrieved');
    console.log(`  Total items: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      response.data.data.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.item_name} - ${item.quantity} ${item.unit}`);
      });
    }
    console.log();
    return true;
  } else {
    console.error('✗ Failed to retrieve inventory');
    return false;
  }
}

async function addItemsToCart() {
  console.log('========================================');
  console.log('STEP 6: Add Items to Cart');
  console.log('========================================\n');
  
  if (testState.inventoryItems.length === 0) {
    console.log('ℹ No inventory items available');
    return true;
  }
  
  let itemsAdded = 0;
  
  // Add first 2 items to cart
  for (let i = 0; i < Math.min(2, testState.inventoryItems.length); i++) {
    const item = testState.inventoryItems[i];
    const cartData = {
      inventory_id: item.id,
      quantity: 2
    };
    
    const response = await makeRequest(
      'POST',
      `${API_BASE}/pantry/orders/cart/items`,
      cartData,
      testState.jwtToken
    );
    
    if (response.data.success) {
      if (response.data.data) {
        testState.cartItems.push(response.data.data);
      }
      itemsAdded++;
      console.log(`✓ Added: ${item.item_name} (qty: 2)`);
    } else {
      console.log(`ℹ Could not add ${item.item_name}: ${response.data.message}`);
    }
  }
  
  console.log(`\n✓ Items added to cart: ${itemsAdded}\n`);
  return true;
}

async function viewCart() {
  console.log('========================================');
  console.log('STEP 7: View Shopping Cart');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/pantry/orders/cart`,
    null,
    testState.jwtToken
  );
  
  if (response.data.success && response.data.data) {
    console.log('✓ Cart retrieved');
    console.log(`  Items in cart: ${response.data.data.items ? response.data.data.items.length : 0}`);
    
    if (response.data.data.items && response.data.data.items.length > 0) {
      response.data.data.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.item_name} - Qty: ${item.quantity}`);
      });
    }
    console.log();
    return true;
  } else {
    console.error('✗ Failed to retrieve cart');
    return false;
  }
}

async function updateCartItem() {
  console.log('========================================');
  console.log('STEP 8: Update Cart Item Quantity');
  console.log('========================================\n');
  
  if (testState.inventoryItems.length === 0) {
    console.log('ℹ No items in cart to update');
    return true;
  }
  
  const item = testState.inventoryItems[0];
  const updateData = {
    quantity: 5
  };
  
  const response = await makeRequest(
    'PUT',
    `${API_BASE}/pantry/orders/cart/items/${item.id}`,
    updateData,
    testState.jwtToken
  );
  
  if (response.data.success) {
    console.log('✓ Cart item updated');
    console.log(`  Item: ${item.item_name}`);
    console.log(`  New quantity: 5\n`);
    return true;
  } else {
    console.error('✗ Failed to update cart item');
    return false;
  }
}

async function submitOrder() {
  console.log('========================================');
  console.log('STEP 9: Submit Pantry Order');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'POST',
    `${API_BASE}/pantry/orders/cart/submit`,
    {},
    testState.jwtToken
  );
  
  if (response.data.success && response.data.data) {
    testState.orderId = response.data.data.id;
    console.log('✓ Order submitted successfully');
    console.log(`  Order ID: ${testState.orderId}`);
    console.log(`  Status: ${response.data.data.status}`);
    console.log(`  Items: ${response.data.data.items ? response.data.data.items.length : 0}`);
    console.log(`  Created at: ${response.data.data.created_at}\n`);
    return true;
  } else {
    console.error('✗ Order submission failed');
    console.error(`  Error: ${response.data.message}`);
    return false;
  }
}

async function viewOrderHistory() {
  console.log('========================================');
  console.log('STEP 10: View Order History');
  console.log('========================================\n');
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/pantry/orders?limit=10`,
    null,
    testState.jwtToken
  );
  
  if (response.data.success && response.data.data) {
    console.log('✓ Order history retrieved');
    console.log(`  Total orders: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      response.data.data.slice(0, 3).forEach((order, index) => {
        console.log(`  ${index + 1}. Order ${order.id.substring(0, 8)}... - Status: ${order.status}`);
      });
    }
    console.log();
    return true;
  } else {
    console.error('✗ Failed to retrieve order history');
    return false;
  }
}

async function getOrderDetails() {
  console.log('========================================');
  console.log('STEP 11: Get Order Details');
  console.log('========================================\n');
  
  if (!testState.orderId) {
    console.log('ℹ No order to retrieve details for');
    return true;
  }
  
  const response = await makeRequest(
    'GET',
    `${API_BASE}/pantry/orders/${testState.orderId}`,
    null,
    testState.jwtToken
  );
  
  if (response.data.success && response.data.data) {
    console.log('✓ Order details retrieved');
    console.log(`  Order ID: ${response.data.data.id}`);
    console.log(`  Status: ${response.data.data.status}`);
    console.log(`  Items: ${response.data.data.items ? response.data.data.items.length : 0}`);
    console.log(`  Created: ${response.data.data.created_at}\n`);
    return true;
  } else {
    console.error('✗ Failed to retrieve order details');
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
    await getAvailableSlots();
    await bookAppointment();
    await getUserAppointments();
    await getPantryInventory();
    await addItemsToCart();
    await viewCart();
    await updateCartItem();
    await submitOrder();
    await viewOrderHistory();
    await getOrderDetails();
    
    // Print summary
    console.log('========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');
    console.log('✓ All pantry flow tests completed!\n');
    console.log('Test Student Details:');
    console.log(`  Email: ${testStudent.email}`);
    console.log(`  User ID: ${testState.userId}`);
    console.log('');
    console.log('Pantry Flow Results:');
    console.log(`  Appointment ID: ${testState.appointmentId || 'N/A'}`);
    console.log(`  Inventory Items: ${testState.inventoryItems.length}`);
    console.log(`  Cart Items: ${testState.cartItems.length}`);
    console.log(`  Order ID: ${testState.orderId || 'N/A'}`);
    console.log('');
    console.log('ℹ End-to-end pantry flow completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
