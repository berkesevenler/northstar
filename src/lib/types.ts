export type ProjectStatus = "planning" | "active" | "on-hold" | "completed";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  customerId?: string;
  startDate: string;
  endDate?: string;
  budget: number;
  createdAt: string;
}

export type CustomerStatus = "lead" | "active" | "churned";
export type BillingCycle = "monthly" | "yearly" | "one-time";

export interface Customer {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  status: CustomerStatus;
  billingCycle: BillingCycle;
  monthlyValue: number;
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
}

export type RevenueType = "subscription" | "one-time" | "service" | "other";

export interface RevenueEntry {
  id: string;
  customerId?: string;
  projectId?: string;
  description: string;
  type: RevenueType;
  amount: number;
  date: string;
  createdAt: string;
}

export type TargetMetric = "mrr" | "arr" | "customers" | "projects" | "revenue";
export type TargetPeriod = "monthly" | "quarterly" | "yearly";

export interface Target {
  id: string;
  name: string;
  metric: TargetMetric;
  period: TargetPeriod;
  targetValue: number;
  dueDate: string;
  notes?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;        // "YYYY-MM-DD"
  startTime?: string;  // "HH:MM"
  endTime?: string;    // "HH:MM"
  description?: string;
  location?: string;
  attendees?: string;  // comma-separated names/emails
  createdAt: string;
}
