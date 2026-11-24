export type Tab = 'overview' | 'crew-change' | 'employees' | 'vacations' | 'emp-requests' | 'expiring-docs' | 'ended-docs' | 'ended-vacations' | 'timesheet';
export type TravelMode = 'fly' | 'car' | 'road_half_fly';

export interface Employee {
  id: string;
  employee_number: string;
  name: string;
  position?: string;
  nationality?: string;
  rig?: string;
  phone?: string;
  is_suspended?: boolean;
  joining_date?: string;
  auth_expiry_date?: string;
  health_cert_expiry_date?: string;
  auth_status?: string;
}

export interface CpoRequest {
  id: string;
  employee_name: string;
  employee_number: string;
  grade?: string;
  nationality?: string;
  destination?: string;
  final_destination?: string;
  route_stops: string[];
  travel_mode?: string;
  status: string;
  rig?: string;
  flight_ticket_confirmed?: boolean;
  hotel_confirmed?: boolean;
}

export interface VacationRequest {
  id: string;
  employee_number: string;
  employee_name: string;
  rig: string;
  requested_by: string;
  status: string;
  destination?: string;
  travel_mode?: string;
  flight_ticket_confirmed?: boolean;
  hotel_confirmed?: boolean;
  route_stops?: string[];
  end_date?: string;
  start_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
}

export interface CrewChangeRow {
  id: string;
  employee_number: string;
  employee_name: string;
  rig: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  notes: string | null;
  phase: 'upcoming_departure' | 'on_vacation' | 'returned' | 'other';
  days_until_next_event: number | null;
  days_on_vacation: number | null;
}

export interface TimesheetRow {
  id: string;
  employee_number: string;
  employee_name: string;
  rig: string;
  actual_start_date: string;
  actual_end_date: string | null;
  vacation_days: number;
  rig_days_before: number | null;
  is_currently_on_vacation: boolean;
}

export interface Rig {
  id: string;
  label: string;
  total: number;
  suspended: number;
}
