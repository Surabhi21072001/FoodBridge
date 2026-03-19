export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'student' | 'provider' | 'admin';
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
}

export interface FoodListing {
  id: string;
  provider_id: string;
  title: string;
  description?: string;
  category: 'meal' | 'snack' | 'beverage' | 'pantry_item' | 'deal' | 'event_food';
  cuisine_type?: string;
  dietary_tags?: string[];
  allergen_info?: string[];
  quantity_available: number;
  quantity_reserved: number;
  unit: string;
  original_price?: number;
  discounted_price?: number;
  pickup_location: string;
  available_from: Date;
  available_until: Date;
  image_urls?: string[];
  status: 'active' | 'reserved' | 'completed' | 'cancelled' | 'expired';
  created_at: Date;
  updated_at: Date;
}

export interface Reservation {
  id: string;
  listing_id: string;
  user_id: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'picked_up' | 'cancelled' | 'no_show';
  pickup_time?: Date;
  confirmation_code?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  cancelled_at?: Date;
  picked_up_at?: Date;
}

export interface PantryAppointment {
  id: string;
  user_id: string;
  appointment_time: Date;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  google_event_id?: string;
  created_at: Date;
  updated_at: Date;
  cancelled_at?: Date;
  completed_at?: Date;
}

export interface PantryInventory {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  expiration_date?: Date;
  dietary_tags?: string[];
  allergen_info?: string[];
  location?: string;
  reorder_threshold: number;
  created_at: Date;
  updated_at: Date;
}

export interface PantryOrder {
  id: string;
  appointment_id?: string;
  user_id: string;
  status: 'cart' | 'submitted' | 'prepared' | 'picked_up' | 'cancelled';
  total_items: number;
  created_at: Date;
  updated_at: Date;
  submitted_at?: Date;
  picked_up_at?: Date;
}

export interface PantryOrderItem {
  id: string;
  order_id: string;
  inventory_id: string;
  quantity: number;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  created_at: Date;
  read_at?: Date;
}
