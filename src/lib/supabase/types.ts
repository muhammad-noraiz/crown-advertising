export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type LandType = 'private' | 'government' | 'crown';
export type ExpenseType = 'installation' | 'land_rent' | 'tax' | 'maintenance' | 'other';

export interface Location {
  id: number;
  name: string;
  size: string;
  city: string;
  address: string | null;
  land_type: LandType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  location_id: number;
  client_id: number | null;
  client_name: string;
  amount: number;
  sale_person: string | null;
  vendor: string | null;
  locking_ref: string | null;
  invoice_no: string | null;
  invoice_status: InvoiceStatus;
  start_date: string;
  end_date: string;
  duration: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationExpense {
  id: number;
  location_id: number;
  expense_type: ExpenseType;
  amount: number;
  expense_date: string;
  is_recurring: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationPartner {
  id: number;
  location_id: number;
  partner_name: string;
  phone: string | null;
  email: string | null;
  percentage: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationWithBookings extends Location {
  bookings: Booking[];
}

export interface BookingWithLocation extends Booking {
  locations: Pick<Location, 'id' | 'name' | 'size' | 'city'> | null;
}

export interface LocationImage {
  id: number;
  location_id: number;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | null;
  created_at: string;
}

export interface BookingWithClient extends Booking {
  clients: Pick<Client, 'id' | 'name' | 'company'> | null;
  locations: Pick<Location, 'id' | 'name' | 'size' | 'city'> | null;
}

export interface Database {
  public: {
    Tables: {
      locations: {
        Row: Location;
        Insert: Omit<Location, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Booking, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      location_expenses: {
        Row: LocationExpense;
        Insert: Omit<LocationExpense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LocationExpense, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      location_partners: {
        Row: LocationPartner;
        Insert: Omit<LocationPartner, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LocationPartner, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Enums: {
      invoice_status: InvoiceStatus;
      land_type: LandType;
      expense_type: ExpenseType;
    };
    Functions: Record<string, never>;
  };
}
