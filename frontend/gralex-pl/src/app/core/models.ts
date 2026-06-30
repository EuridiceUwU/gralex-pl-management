export interface AuthUser {
  user_id: number;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  ok: boolean;
  token: string;
  user: AuthUser;
}

export interface DashboardSummary {
  total_shipments: number;
  total_revenue: string;
  total_cost: string;
  total_margin: string;
  total_customers: number;
  total_suppliers: number;
  total_employees: number;
}

export interface SupplierBreakdown {
  supplier_id: number;
  supplier_name: string;
  total: number;
  revenue: string;
}

export interface StatusBreakdown {
  ss_id: number;
  ss_name: string;
  total: number;
}

export interface DashboardResponse {
  ok: boolean;
  summary: DashboardSummary;
  bySupplier: SupplierBreakdown[];
  byStatus: StatusBreakdown[];
}

export interface Shipment {
  shipment_id: number;
  tracking_num: string;
  customer_name: string;
  supplier_name: string;
  status_name: string;
  weight: string | null;
  service: string | null;
  cost: string | null;
  price: string | null;
  margin: string | null;
  creation_date: string | null;
}

export interface Customer {
  customer_id: number;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  rfc: string | null;
  status: boolean;
}

export interface Supplier {
  supplier_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  rfc: string | null;
  credit_amount: string | null;
  status: boolean;
}

export interface SupplierWithBalance extends Supplier {
  total_consumed: string;
  available_balance: string | null;
}

export interface Employee {
  employee_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role_name: string;
  status: boolean;
}

export interface OcrResult {
  ok: boolean;
  filename: string;
  raw_text: string;
  fields: Record<string, string | null>;
}
