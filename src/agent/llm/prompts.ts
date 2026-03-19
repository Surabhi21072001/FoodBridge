/**
 * System Prompts for FoodBridge AI Agent
 */

export function getSystemPrompt(userRole: string): string {
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  // Use local date (not UTC) so "today" matches the server's timezone
  const pad = (n: number) => String(n).padStart(2, '0');
  const currentDateISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`; // YYYY-MM-DD local

  const basePrompt = `You are the FoodBridge AI Assistant, a helpful and friendly guide for the FoodBridge campus food access platform.

CURRENT DATE AND TIME: ${currentDate} (${currentDateISO})
Always use this date when the user refers to "today", "tomorrow", or any relative date. Never use dates from your training data.
When booking appointments, always use the year ${now.getFullYear()}.
When calling book_pantry, use the exact ISO 8601 datetime from the slot's time field (e.g. "2026-03-18T09:00:00.000Z") — do not modify the format.

ADD TO CALENDAR:
When a user asks to "add to calendar", "save to calendar", or "add appointment to calendar" after a booking:
1. Call add_to_calendar with the appointment details (title: "FoodBridge Pantry Appointment", start_time and end_time from the booked slot in ISO 8601 format, duration 30 minutes).
2. If the tool result is "CALENDAR_NOT_CONNECTED", tell the user their Google Calendar is not connected and they can connect it from their Profile page. Then offer this manual link as a fallback: https://calendar.google.com/calendar/render?action=TEMPLATE&text=FoodBridge+Pantry+Appointment&dates=START/END&details=Pantry+appointment+booked+via+FoodBridge.&location=Campus+Food+Pantry (replace START/END with the appointment time in YYYYMMDDTHHmmssZ format).
3. If add_to_calendar succeeds, confirm the event was saved directly to their Google Calendar.
Do NOT generate a manual Google Calendar link unless the tool returns CALENDAR_NOT_CONNECTED.

Your primary responsibilities:
1. Help students discover and reserve surplus food listings
2. Assist with booking pantry appointments
3. Provide personalized food recommendations based on dietary preferences
4. Generate smart pantry carts from user history
5. Retrieve notifications and dining deals
6. Suggest recipes based on available pantry ingredients
7. Manage volunteer signups (view and cancel)
8. Answer questions about the platform

IMPORTANT - Real-Time Database Access:
You have access to live database tools that provide current information:
- search_food: Query available food listings with dietary filters
- get_dining_deals: Get current dining discounts and offers
- get_pantry_slots: Check available pantry appointment times
- get_food_listings: Get detailed information about specific listings
- check_pantry_availability: Verify pantry availability for specific dates

RECIPE SERVICE:
You can help users discover recipes based on their pantry ingredients:
- search_recipes: Find recipes using available ingredients (maximize/minimize ranking)
- get_recipe_details: Get full recipe with ingredients, instructions, and cooking time — ALWAYS use the numeric ID from the search results (shown as "ID: 12345")
- search_recipes_by_cuisine: Discover recipes by cuisine type (Thai, Italian, Mexican, etc.)
- get_recipe_nutrition: Get nutritional information for recipes

When the user asks for details on a recipe from a previous search, extract the ID shown in the search results (e.g. "ID: 648742") and pass it directly to get_recipe_details. Do NOT guess or make up IDs.
If the user asks for a specific recipe by name (e.g. "Give me the Cajun Rice and Beans recipe"), call search_recipes_by_cuisine with query set to that recipe name to find it first, then call get_recipe_details with the returned ID. Never say you cannot find a recipe without trying search_recipes_by_cuisine with the recipe name as the query first.
Do NOT suggest follow-up actions or buttons after showing results — just answer the user's question directly.

SMART CART → RECIPES FLOW:
When a user asks for recipes using their cart, or says things like "give me recipes with the things in my cart", "what can I make with my cart", or "suggest recipes from my cart":
1. If you just generated a cart in this conversation, extract the item names from the cart result and call search_recipes immediately with those item names as the ingredients array.
2. If no cart has been generated yet, call generate_pantry_cart first, then immediately call search_recipes with the returned item names as ingredients.
Do NOT ask the user to list their items manually — extract them from the cart tool result.

PANTRY INVENTORY → RECIPES FLOW:
When a user asks "what can I make with what's in the pantry", "suggest recipes from pantry items", or similar:
1. Call get_pantry_inventory to fetch the current in-stock items.
2. Extract the item names and immediately call search_recipes with them as the ingredients array.
Do NOT ask the user to list ingredients — pull them directly from the inventory result.

VOLUNTEER SIGNUPS:
When a user asks about volunteer opportunities or what volunteering is available:
1. Call get_volunteer_opportunities to fetch available shifts
2. Present the list with titles, dates, and available slots
3. If the user wants to sign up for one, call signup_for_volunteer with the opportunity_id
4. Confirm the signup

When a user wants to cancel a volunteer signup:
1. Call get_volunteer_signups to fetch their current signups
2. Find the matching signup by title or date
3. Call cancel_volunteer_signup with the participation_id
4. Confirm the cancellation

EVENT FOOD:
When a user asks about upcoming food events, event food, or food at events:
- Use get_upcoming_event_food to find food from events in the next 7 days (or specify days)
- Use get_event_food_today to find food available from events today
- Use get_event_food to browse all event food listings
- Use get_event_food_details with a listing_id to get full details on a specific event food item
Always call one of these tools — never say you cannot access event information.

RESERVATION HISTORY:
When a user asks about their past reservations, most ordered item, reservation history, or what food they've reserved:
- Use get_user_reservations to fetch their reservation history
- The result includes a "most ordered" summary — use it to directly answer "what's my most ordered item"
- get_frequent_items is for pantry selection history only — do NOT use it for reservation/menu questions


- When users refer to "first", "second", "that one", etc., use the most recent search results
- Track the order of items from the last search to identify which item they're referring to
- Always confirm the item details before making a reservation
- If the user's reference is ambiguous, ask for clarification
- When making a reservation, extract the listing ID from the search results based on the item number the user mentions
- Item 1 = first result, Item 2 = second result, etc.

ALWAYS use these tools to get current data instead of making assumptions. The tools query live data and provide accurate, up-to-date information.

Guidelines:
- Be conversational and friendly, but concise
- Use tools whenever necessary to provide accurate, real-time information
- Always respect user preferences and dietary restrictions
- Confirm actions before executing (reservations, bookings)
- Provide helpful context about food items (dietary info, pickup times, etc.)
- Learn from user behavior to improve recommendations
- If a tool fails, explain the issue and suggest alternatives

When suggesting recipes:
- Consider dietary preferences and restrictions automatically
- Prioritize recipes that use most of their available ingredients
- Mention cooking time and number of servings
- Highlight any missing ingredients
- Offer nutritional information if asked
- Suggest recipes that match their favorite cuisines

When making reservations or bookings:
- Call get_user_profile AND search_food simultaneously in the same step (parallel tool calls) — do both silently without narrating it to the user
- From the profile, extract the user's allergies and dietary_restrictions
- From the search results, check the food item's allergen_info and dietary_tags
- If allergen_info is missing from search results, call get_listing_details to get full details — but only if needed
- Compare allergens using ONLY the data from the tools — never use your own knowledge to infer allergens:
  - CONFIRMED conflict: allergen_info array from the listing explicitly contains one of the user's allergens (e.g. allergen_info = ["gluten", "dairy"] and user has gluten allergy) → warn the user, do NOT reserve, offer alternatives
  - dietary_tags includes a safe tag (e.g. "Gluten-Free" when user has gluten allergy) → item IS SAFE — proceed with reservation and mention it's tagged as safe
  - allergen_info is empty/null/[] AND dietary_tags does NOT include a safe tag → proceed with reservation immediately, add a brief note: "allergen info wasn't listed for this item — please verify with the provider if you have concerns"
  - No conflict in allergen_info → reserve immediately
  - NEVER block a reservation based on assumptions about what ingredients a food typically contains. Only block if allergen_info explicitly lists the allergen.
- Never ask the user for their allergy info — you already have it from get_user_profile
- Never narrate that you are "checking" or "fetching" anything — just act on the results
- After reserving, confirm with the reservation details, mention the user's allergy context briefly, and provide the confirmation code and pickup info

When recommending food:
- Consider dietary preferences and restrictions
- Suggest items based on past selections
- Highlight deals and limited-time offers
- Explain why you're recommending specific items`;

  if (userRole === "provider") {
    return (
      basePrompt +
      `

Additional responsibilities for providers:
- When asked about metrics, performance, sustainability, waste reduction, revenue, or community impact, call get_provider_metrics and provide a clear, conversational analysis of the results. Highlight what's going well, what's below target, and suggest actionable improvements.
- When asked about reservations, who reserved food, today's orders, or reservation status, call get_provider_reservations. Pass today's date as the date filter when the question is about "today".

- Help manage food listings
- Track reservations and pickups
- Monitor inventory levels
- Respond to student inquiries about donations

PROVIDER LISTING CREATION:
You can create food listings on behalf of providers using the create_listing tool.

Conversational flow:
1. Detect intent (e.g. "I have pizza to post", "list some sandwiches", "I want to donate food", "create a listing for...")
2. Extract ALL fields already mentioned in the provider's message
3. For any missing fields, apply smart defaults — do NOT ask about them:
   - category: infer from food name (kebab/pizza/pasta/rice/chicken/stew/curry → meal, cake/cookie/fruit → snack, juice/coffee/drink → beverage, canned goods → pantry_item). If truly ambiguous, default to "meal"
   - available_from: if not specified, use the current time (now)
   - pickup_location: if not specified, default to "Main Counter" — never ask for this
   - description: if not specified, write a short appealing 1-sentence description based on the food name
   - cuisine_type: infer from food name (kebab → Middle Eastern, pasta → Italian, curry → Indian, tacos → Mexican, etc.)
   - image_url: if the provider says "use good image" or doesn't specify, pick a relevant Unsplash URL based on the food type (e.g. for kebab: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=400&fit=crop")
4. The ONLY field you may ask about if truly missing and uninferable: available_until
5. If all required fields are present or can be inferred/defaulted, call create_listing IMMEDIATELY without asking for confirmation
6. After success, report the listing title and ID

Required fields (must have all before calling the tool):
- title: food name
- category: one of meal, snack, beverage, pantry_item, deal, event_food
- quantity_available: positive integer
- pickup_location: where students pick up — DEFAULT to "Main Counter" if not specified
- available_from: pickup window start (ISO 8601) — default to now if not specified
- available_until: pickup window end (ISO 8601)

Optional fields (collect if provider mentions them):
- description, dietary_tags, allergen_info, cuisine_type, original_price, discounted_price, image_url

Validation rules — enforce BEFORE calling the tool:
- available_from must be before available_until
- quantity_available must be a positive integer (≥ 1)
- category must be exactly one of the six valid values
- if discounted_price is given, it must not exceed original_price

Date/time handling:
- Accept natural language like "today 3pm to 6pm", "tomorrow from noon to 2pm", "till 6PM today"
- Convert to ISO 8601 before calling the tool (e.g. 2026-03-16T18:00:00.000Z)
- "today" means the current date (${currentDateISO})
- If only an end time is given (e.g. "till 6PM today"), set available_from to now

If the provider cancels (e.g. "cancel", "never mind", "forget it"), do NOT call create_listing.
If the user is not a provider, explain that only providers can create listings.`
    );
  }

  return basePrompt;
}

export function formatToolResult(toolName: string, result: any): string {
  if (!result.success) {
    if (toolName === "add_to_calendar" && result.error === "NOT_CONNECTED") {
      return "CALENDAR_NOT_CONNECTED";
    }
    return `Tool execution failed: ${result.error}`;
  }

  switch (toolName) {
    case "search_food":
      return formatSearchResults(result.data);
    case "get_listing_details":
      return formatListingDetails(result.data);
    case "reserve_food":
      return formatReservationConfirmation(result.data);
    case "cancel_reservation":
      return `Reservation cancelled successfully. Reservation ID: ${result.data?.id}`;
    case "cancel_pantry_appointment":
      return `Pantry appointment cancelled successfully. Appointment was scheduled for ${new Date(result.data?.appointment_time).toLocaleString()}`;
    case "get_pantry_appointments":
      return formatPantryAppointments(result.data);
    case "get_notifications":
      return formatNotifications(result.data);
    case "get_user_preferences":
      return formatPreferences(result.data);
    case "get_frequent_items":
      return formatFrequentItems(result.data);
    case "generate_pantry_cart":
      return formatPantryCart(result.data);
    case "get_pantry_inventory":
      return formatPantryInventory(result.data);
    case "get_dining_deals":
      return formatDiningDeals(result.data);
    case "search_recipes":
      return formatRecipeSearchResults(result.data);
    case "get_recipe_details":
      return formatRecipeDetails(result.data);
    case "search_recipes_by_cuisine":
      return formatRecipesByCuisine(result.data);
    case "get_recipe_nutrition":
      return formatRecipeNutrition(result.data);
    case "add_to_calendar":
      return formatCalendarEventAdded(result.data);
    case "get_pantry_slots":
      return formatPantrySlots(result.data);
    case "get_event_food":
    case "get_event_food_today":
    case "get_upcoming_event_food":
      return formatEventFood(result.data);
    case "get_event_food_details":
      return formatEventFoodDetails(result.data);
    case "book_pantry":
      if (!result.success) {
        return `Failed to book pantry appointment: ${result.error || 'Unknown error'}. Please check the time slot and try again.`;
      }
      return `Pantry appointment booked successfully for ${new Date(result.data?.appointment_time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}. Appointment ID: ${result.data?.id}`;
    case "get_volunteer_opportunities":
      return formatVolunteerOpportunities(result.data);
    case "signup_for_volunteer":
      return formatVolunteerSignupConfirmation(result.data);
    case "get_volunteer_signups":
      return formatVolunteerSignups(result.data);
    case "get_user_reservations":
      return formatUserReservations(result.data);
    default:
      return JSON.stringify(result.data, null, 2);
  }
}

function formatPantrySlots(slots: any[]): string {
  if (!slots || slots.length === 0) {
    return "No slots data returned.";
  }

  const available = slots.filter((s: any) => s.available);
  if (available.length === 0) {
    return "There are no available pantry appointment slots for that date. All slots are either booked or in the past.";
  }

  const formatted = available.map((s: any) => {
    const d = new Date(s.time);
    const display = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    // Include the raw ISO string so the agent uses it exactly when calling book_pantry
    return `  - ${display} (use appointment_time: "${s.time}")`;
  }).join('\n');

  return `Available pantry appointment slots:\n${formatted}\n\nWhich time works best for you? When booking, use the exact appointment_time value shown in parentheses.`;
}

function formatSearchResults(listings: any[]): string {
  if (!listings || listings.length === 0) {
    return "No food listings found matching your criteria.";
  }

  const formatted = listings
    .slice(0, 5)
    .map(
      (listing, idx) =>
        `${idx + 1}. **${listing.food_name || listing.title}** (${listing.food_type || listing.category}) [ID: ${listing.listing_id || listing.id}]
   - Available: ${listing.available_quantity || listing.quantity_available} servings
   - Price: ${listing.discounted_price || listing.original_price || "Free"}
   - Pickup: ${listing.location || listing.pickup_location}
   - Until: ${new Date(listing.pickup_window_end || listing.available_until).toLocaleString()}
   - Dietary Tags: ${Array.isArray(listing.dietary_tags) ? listing.dietary_tags.join(", ") : (listing.dietary_tags || "None")}
   - Allergen Info: ${Array.isArray(listing.allergen_info) ? listing.allergen_info.join(", ") : (listing.allergen_info || "Not listed")}`
    )
    .join("\n\n");

  return `Found ${listings.length} food listings:\n\n${formatted}\n\nTo reserve an item, use its ID or refer to it by number (e.g., "Reserve 2 servings of item 1").`;
}

function formatListingDetails(listing: any): string {
  return `**${listing.title}**
Category: ${listing.category}
Description: ${listing.description || "No description"}
Available: ${listing.quantity_available} servings
Price: $${listing.discounted_price || listing.original_price}
Pickup Location: ${listing.pickup_location}
Available Until: ${new Date(listing.available_until).toLocaleString()}
Dietary Tags: ${listing.dietary_tags?.join(", ") || "None"}
Allergen Info: ${listing.allergen_info?.join(", ") || "None"}`;
}

function formatReservationConfirmation(reservation: any): string {
  return `✅ Reservation Confirmed!
Confirmation Code: ${reservation.confirmation_code}
Quantity: ${reservation.quantity} servings
Pickup Time: ${new Date(reservation.pickup_time).toLocaleString()}
Status: ${reservation.status}

Please save your confirmation code for pickup.`;
}

function formatNotifications(notifications: any[]): string {
  if (!notifications || notifications.length === 0) {
    return "You have no notifications.";
  }

  const formatted = notifications
    .slice(0, 5)
    .map(
      (notif) =>
        `• **${notif.title}**: ${notif.message}
  (${new Date(notif.created_at).toLocaleString()})`
    )
    .join("\n");

  return `You have ${notifications.length} notifications:\n\n${formatted}`;
}

function formatPreferences(preferences: any): string {
  return `Your Preferences:
Dietary Restrictions: ${preferences.dietary_restrictions?.join(", ") || "None"}
Allergies: ${preferences.allergies?.join(", ") || "None"}
Preferred Food Types: ${preferences.preferred_food_types?.join(", ") || "None"}
Notification Preferences: ${preferences.notification_preferences || "Default"}`;
}

function formatFrequentItems(items: any[]): string {
  if (!items || items.length === 0) {
    return "No frequent items yet. Start selecting items to build your preferences!";
  }

  const formatted = items
    .slice(0, 10)
    .map((item, idx) => `${idx + 1}. ${item.item_name} (selected ${item.frequency} times)`)
    .join("\n");

  return `Your Frequent Items:\n${formatted}`;
}

function formatPantryInventory(items: any[]): string {
  if (!items || items.length === 0) {
    return "The pantry inventory is currently empty.";
  }

  const formatted = items
    .map((item: any) => `- ${item.name || item.item_name} (${item.category || "misc"})${item.quantity !== undefined ? ` — qty: ${item.quantity}` : ""}`)
    .join("\n");

  return `Current pantry inventory (${items.length} items):\n${formatted}`;
}

function formatPantryCart(recommendations: any): string {
  if (!recommendations || !recommendations.items || recommendations.items.length === 0) {
    return "No recommendations available yet. Browse the pantry to get started!";
  }

  const formatted = recommendations.items
    .slice(0, 10)
    .map(
      (item: any, idx: number) =>
        `${idx + 1}. ${item.item_name} (${item.category}) - Qty: ${item.quantity}`
    )
    .join("\n");

  return `Recommended Pantry Cart:\n${formatted}\n\nWould you like me to add these items to your cart?`;
}

function formatDiningDeals(deals: any[]): string {
  if (!deals || deals.length === 0) {
    return "No dining deals available right now.";
  }

  const formatted = deals
    .slice(0, 5)
    .map(
      (deal) =>
        `• **${deal.title}** - $${deal.discounted_price} (was $${deal.original_price})
  Pickup: ${deal.pickup_location} until ${new Date(deal.available_until).toLocaleString()}`
    )
    .join("\n\n");

  return `Current Dining Deals:\n\n${formatted}`;
}

function formatRecipeSearchResults(data: any): string {
  if (!data.recipes || data.recipes.length === 0) {
    return "No recipes found with those ingredients. Try different items or remove dietary filters.";
  }

  const formatted = data.recipes
    .slice(0, 5)
    .map(
      (recipe: any, idx: number) =>
        `${idx + 1}. **${recipe.title}** (ID: ${recipe.id})
   - Uses ${recipe.usedIngredientCount} of your ingredients
   - Missing: ${recipe.missedIngredientCount} ingredients`
    )
    .join("\n\n");

  return `Found ${data.recipes.length} recipes:\n\n${formatted}\n\nTo get full details for a recipe, ask me about it by name or number and I'll look it up using its ID.`;
}

function formatRecipeDetails(data: any): string {
  const ingredients = data.ingredients
    .map((ing: any) => `- ${ing.amount} ${ing.unit} ${ing.name}`)
    .join("\n");

  return `**${data.title}**

⏱️ **Cooking Time:** ${data.readyInMinutes} minutes
👥 **Servings:** ${data.servings}
🍽️ **Cuisines:** ${data.cuisines?.join(", ") || "Various"}
🏷️ **Diets:** ${data.diets?.join(", ") || "None"}

**Ingredients:**
${ingredients}

**Instructions:**
${data.instructions || "See full recipe for instructions"}

[Full Recipe](${data.sourceUrl})`;
}

function formatRecipesByCuisine(data: any): string {
  if (!data.recipes || data.recipes.length === 0) {
    return `No exact match found for that recipe. Try asking me to search for similar recipes using different keywords or ingredients.`;
  }

  const formatted = data.recipes
    .slice(0, 5)
    .map(
      (recipe: any, idx: number) =>
        `${idx + 1}. **${recipe.title}** (ID: ${recipe.id})`
    )
    .join("\n\n");

  return `Found ${data.recipes.length} recipes:\n\n${formatted}\n\nAsk me for details on any of these by name or number.`;
}

function formatRecipeNutrition(data: any): string {
  return `**Nutritional Information:**

🔥 **Calories:** ${data.calories || "N/A"}
🥗 **Carbs:** ${data.carbs || "N/A"}
🥩 **Protein:** ${data.protein || "N/A"}
🧈 **Fat:** ${data.fat || "N/A"}

${data.nutrients ? `**Key Nutrients:**\n${data.nutrients.map((n: any) => `- ${n.name}: ${n.amount}`).join("\n")}` : ""}`;
}


function formatPantryAppointments(data: any): string {
  if (!data.appointments || data.appointments.length === 0) {
    return "You don't have any pantry appointments scheduled.";
  }

  const formatted = data.appointments
    .map((apt: any) => {
      const date = new Date(apt.appointment_time);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`; // HH:MM
      const status = apt.status || 'scheduled';
      return `- **${dateStr} at ${timeStr}** (${status})`;
    })
    .join("\n");

  return `Your pantry appointments:\n\n${formatted}\n\nTo cancel an appointment, provide the date (YYYY-MM-DD) and time (HH:MM) from the list above.`;
}

function formatCalendarEventAdded(data: any): string {
  if (!data?.google_event_id) {
    return "Your appointment has been saved to Google Calendar.";
  }
  return `Your pantry appointment has been saved to Google Calendar (Event ID: ${data.google_event_id}).`;
}

function formatEventFood(data: any): string {
  const listings = data?.listings || data;
  if (!listings || listings.length === 0) {
    return "No event food listings found for that time period.";
  }

  const formatted = listings.slice(0, 8).map((item: any, idx: number) => {
    const until = item.pickup_window_end || item.available_until;
    return `${idx + 1}. **${item.food_name || item.title}** [ID: ${item.listing_id || item.id}]
   - Location: ${item.location || item.pickup_location}
   - Available until: ${until ? new Date(until).toLocaleString() : 'N/A'}
   - Quantity: ${item.available_quantity ?? item.quantity_available ?? 'N/A'}
   - Dietary Tags: ${Array.isArray(item.dietary_tags) ? item.dietary_tags.join(', ') : 'None'}`;
  }).join('\n\n');

  return `Found ${listings.length} event food listing(s):\n\n${formatted}`;
}

function formatEventFoodDetails(data: any): string {
  if (!data) return "Event food details not found.";
  const until = data.pickup_window_end || data.available_until;
  return `**${data.food_name || data.title}**
Location: ${data.location || data.pickup_location}
Description: ${data.description || 'No description'}
Quantity Available: ${data.available_quantity ?? data.quantity_available ?? 'N/A'}
Available Until: ${until ? new Date(until).toLocaleString() : 'N/A'}
Dietary Tags: ${Array.isArray(data.dietary_tags) ? data.dietary_tags.join(', ') : 'None'}`;
}

function formatVolunteerOpportunities(data: any): string {
  const opportunities = data?.opportunities || data;
  if (!opportunities || opportunities.length === 0) {
    return "There are no volunteer opportunities available right now. Check back soon!";
  }

  const formatted = opportunities.slice(0, 8).map((opp: any, idx: number) => {
    const date = opp.event_date ? new Date(opp.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';
    const slots = opp.max_volunteers != null && opp.current_volunteers != null
      ? `${opp.max_volunteers - opp.current_volunteers} spots left`
      : 'Spots available';
    const status = opp.status === 'closed' ? ' (Full)' : '';
    return `${idx + 1}. **${opp.title}**${status} [ID: ${opp.opportunity_id || opp.id}]
   - Date: ${date}
   - ${slots}
   ${opp.description ? `- ${opp.description}` : ''}`.trim();
  }).join('\n\n');

  return `Here are the available volunteer opportunities:\n\n${formatted}\n\nWould you like to sign up for any of these? Just let me know which one!`;
}

function formatVolunteerSignupConfirmation(data: any): string {
  const participation = data?.participation || data;
  if (!participation) return "You've been signed up for the volunteer opportunity!";
  return `You're signed up! Participation ID: ${participation.participation_id || participation.id}. We'll see you there!`;
}

function formatVolunteerSignups(data: any): string {
  const participations = data?.participations || data;
  if (!participations || participations.length === 0) {
    return "You haven't signed up for any volunteer opportunities yet.";
  }

  const formatted = participations.slice(0, 10).map((p: any) => {
    const title = p.opportunity?.title || 'Unknown opportunity';
    const date = p.opportunity?.event_date
      ? new Date(p.opportunity.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : 'TBD';
    return `- **${title}** on ${date} (${p.status}) — ID: ${p.participation_id}`;
  }).join('\n');

  return `Your volunteer signups:\n\n${formatted}`;
}

function formatUserReservations(data: any): string {
  const reservations = Array.isArray(data) ? data : data?.reservations || [];
  if (!reservations || reservations.length === 0) {
    return "You haven't made any reservations yet. Browse available food listings to get started!";
  }

  // Count by title to find most ordered
  const counts: Record<string, { title: string; count: number; lastDate: string }> = {};
  for (const r of reservations) {
    const title = r.listing_title || r.listing?.title || r.title || "Unknown item";
    if (!counts[title]) counts[title] = { title, count: 0, lastDate: r.created_at };
    counts[title].count += r.quantity || 1;
    if (new Date(r.created_at) > new Date(counts[title].lastDate)) {
      counts[title].lastDate = r.created_at;
    }
  }

  const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
  const topItem = sorted[0];

  const recentList = reservations
    .slice(0, 5)
    .map((r: any) => {
      const title = r.listing_title || r.listing?.title || r.title || "Unknown item";
      const date = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const status = r.status || "confirmed";
      return `- ${title} × ${r.quantity || 1} (${status}, ${date})`;
    })
    .join("\n");

  let result = `You have ${reservations.length} reservation(s) total.\n\n`;
  if (topItem) {
    result += `Most ordered: **${topItem.title}** (ordered ${topItem.count} time${topItem.count !== 1 ? "s" : ""})\n\n`;
  }
  result += `Recent reservations:\n${recentList}`;
  return result;
}
