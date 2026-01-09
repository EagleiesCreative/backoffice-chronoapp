// Database Types for ChronoSnap Admin Backoffice
// These types mirror the Supabase database schema

export interface Organization {
  id: string;
  name: string | null;
  slug: string | null;
  created_at: string | null;
  updated_at: string | null;
  subscription_plan: 'basic' | 'pro';
  subscription_status: 'active' | 'cancelled' | 'expired' | 'past_due';
  subscription_expires_at: string | null;
  max_booths: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  image_url: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'org:admin' | 'org:member';
  revenue_share_percentage: number;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  created_at: string | null;
  // Joined fields
  user?: User;
  organization?: Organization;
}

export interface Booth {
  id: string;
  organization_id: string;
  name: string | null;
  location: string | null;
  status: 'active' | 'inactive';
  booth_code: string | null;
  dslrbooth_api: string | null;
  dslrbooth_pass: string | null;
  price: number | null;
  assigned_to: string | null;
  created_by: string | null;
  device_name: string | null;
  device_ip: string | null;
  last_heartbeat: string | null;
  app_pin: string | null;
  created_at: string | null;
  // Joined fields
  organization?: Organization;
  assigned_user?: User;
}

export interface Voucher {
  id: string;
  booth_id: string;
  code: string | null;
  discount_amount: number | null;
  discount_type: 'fixed' | 'percentage';
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string | null;
}

export interface Payment {
  id: string;
  booth_id: string;
  session_id: string | null;
  amount: number | null;
  status: 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED' | 'FAILED';
  payment_method: string | null;
  xendit_invoice_id: string | null;
  xendit_invoice_url: string | null;
  paid_at: string | null;
  created_at: string | null;
  // Joined fields
  booth?: Booth;
}

export interface Session {
  id: string;
  booth_id: string;
  payment_id: string | null;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  frame_count: number;
  created_at: string | null;
}

export interface Frame {
  id: string;
  session_id: string;
  image_url: string | null;
  thumbnail_url: string | null;
  created_at: string | null;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  organization_id: string;
  amount: number | null;
  fee: number | null;
  net_amount: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  xendit_disbursement_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  completed_at: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  // Joined fields
  user?: User;
  organization?: Organization;
}

export interface SubscriptionPlan {
  id: 'basic' | 'pro';
  name: string | null;
  price: number | null;
  currency: string;
  max_booths: number;
  features: Record<string, boolean> | null;
  created_at: string | null;
}

export interface SubscriptionHistory {
  id: string;
  organization_id: string;
  plan_id: string | null;
  action: 'created' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed';
  previous_plan: string | null;
  amount: number | null;
  payment_method: string | null;
  payment_id: string | null;
  created_at: string | null;
}

export interface Report {
  id: string;
  organization_id: string;
  type: 'monthly' | 'custom';
  period_start: string | null;
  period_end: string | null;
  excel_url: string | null;
  pdf_url: string | null;
  status: 'pending' | 'generated' | 'failed';
  created_at: string | null;
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalBooths: number;
  onlineBooths: number;
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  pendingWithdrawals: number;
  pendingWithdrawalsAmount: number;
  subscriptionDistribution: {
    basic: number;
    pro: number;
  };
  recentActivity: Activity[];
  revenueChart: { date: string; amount: number }[];
}

export interface Activity {
  id: string;
  type: 'signup' | 'payment' | 'withdrawal' | 'subscription' | 'booth';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
}
