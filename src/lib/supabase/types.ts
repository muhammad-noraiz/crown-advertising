export type InvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type BillingType = 'monthly' | 'end_of_term';
export type ManagementRole = 'super_admin' | 'custom';
export type DashboardPermission = 'overview' | 'locations' | 'bookings' | 'clients' | 'accounts';
export type LandType = 'private' | 'government' | 'crown';
export type PricingBasis = 'monthly' | 'slot' | 'on_request';
export type LocationMediaCategory = 'static' | 'motorway' | 'digital' | 'bridge-panel' | 'toll-plaza';
export type ExpenseType =
  | 'rent'
  | 'tax'
  | 'electricity_bills_lights_charges'
  | 'pr_commission'
  | 'noc_fees'
  | 'labour_installation_cost';

export interface Location {
  id: number;
  name: string;
  size: string;
  city: string;
  address: string | null;
  land_type: LandType;
  price_per_month: number | null;
  price_label: string | null;
  pricing_basis: PricingBasis;
  facing_from: string | null;
  facing_towards: string | null;
  media_category: LocationMediaCategory;
  source_slide: number | null;
  public_image_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type LocationInsert = {
  name: string;
  size: string;
  city: string;
  address?: string | null;
  land_type?: LandType;
  price_per_month?: number | null;
  price_label?: string | null;
  pricing_basis?: PricingBasis;
  facing_from?: string | null;
  facing_towards?: string | null;
  media_category?: LocationMediaCategory;
  source_slide?: number | null;
  public_image_path?: string | null;
  is_active?: boolean;
};

export type LocationUpdate = Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>;

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
  billing_type: BillingType;
  start_date: string;
  end_date: string;
  duration: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingInvoice {
  id: number;
  booking_id: number;
  invoice_no: string;
  period_start: string | null;
  period_end: string | null;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  last_payment_date: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface ManagementUser {
  id: string;
  email: string;
  display_name: string | null;
  role: ManagementRole;
  permissions: DashboardPermission[];
  created_by: string | null;
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
  bookings: (Booking & { booking_invoices?: BookingInvoice[] })[];
}

export interface BookingWithLocation extends Booking {
  locations: Pick<Location, 'id' | 'name' | 'size' | 'city'> | null;
  booking_invoices?: BookingInvoice[];
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

/** Legal paperwork for a site — agreements, NOCs, ownership papers. Stored in a private bucket. */
export interface LocationDocument {
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
        Insert: LocationInsert;
        Update: LocationUpdate;
        Relationships: [];
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Booking, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      booking_invoices: {
        Row: BookingInvoice;
        Insert: Omit<BookingInvoice, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BookingInvoice, 'id' | 'booking_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      invoice_payments: {
        Row: InvoicePayment;
        Insert: Omit<InvoicePayment, 'id' | 'created_at'>;
        Update: Partial<Omit<InvoicePayment, 'id' | 'invoice_id' | 'created_at'>>;
        Relationships: [];
      };
      management_users: {
        Row: ManagementUser;
        Insert: Omit<ManagementUser, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ManagementUser, 'id' | 'created_at' | 'updated_at'>>;
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
      location_images: {
        Row: LocationImage;
        Insert: Omit<LocationImage, 'id' | 'created_at'>;
        Update: Partial<Omit<LocationImage, 'id' | 'created_at'>>;
        Relationships: [];
      };
      location_documents: {
        Row: LocationDocument;
        Insert: Omit<LocationDocument, 'id' | 'created_at'>;
        Update: Partial<Omit<LocationDocument, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Enums: {
      invoice_status: InvoiceStatus;
      billing_type: BillingType;
      management_role: ManagementRole;
      dashboard_permission: DashboardPermission;
      land_type: LandType;
      expense_type: ExpenseType;
    };
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
