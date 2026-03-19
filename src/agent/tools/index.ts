/**
 * AI Agent Tools Index
 * Exports all available tools for the agent
 */

// Re-export from definitions for convenience
export { AGENT_TOOLS, getToolByName, getToolNames } from "./definitions";

// Export individual tool implementations
export { searchFood } from "./searchFood";
export { reserveFood } from "./reserveFood";
export { cancelReservation } from "./cancelReservation";
export { cancelPantryAppointment } from "./cancelPantryAppointment";
export { getUserReservations } from "./getUserReservations";
export { getPantrySlots } from "./getPantrySlots";
export { getPantryAppointments } from "./getPantryAppointments";
export { bookPantry } from "./bookPantry";
export { generatePantryCart } from "./generatePantryCart";
export { getFrequentPantryItems } from "./getFrequentPantryItems";
export { getNotifications } from "./getNotifications";
export { markNotificationRead } from "./markNotificationRead";
export { getUserProfile } from "./getUserProfile";
export { updateUserProfile } from "./updateUserProfile";
export { retrieveUserPreferences } from "./retrieveUserPreferences";
export { getDiningDeals } from "./getDiningDeals";
export { getEventFood } from "./getEventFood";
export { getEventFoodDetails } from "./getEventFoodDetails";
export { getEventFoodToday } from "./getEventFoodToday";
export { getUpcomingEventFood } from "./getUpcomingEventFood";
export { getProviderEventFood } from "./getProviderEventFood";
export { getProviderListingsDashboard } from "./getProviderListingsDashboard";
export { getProviderMyListings } from "./getProviderMyListings";
export { suggestRecipes } from "./suggestRecipes";
export { getCalendarStatus } from "./getCalendarStatus";
export { disconnectCalendar } from "./disconnectCalendar";
export { addToCalendar } from "./addToCalendar";
export { getProviderMetrics } from "./getProviderMetrics";
export { getProviderReservations } from "./getProviderReservations";
