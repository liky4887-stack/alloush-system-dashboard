export type Tab = 'overview' | 'crew-change' | 'employees' | 'vacations' | 'emp-requests';

export interface Rig {
  id: string;
  label: string;
  total: number;
  suspended: number;
}

export interface Employee {
  id: string;
  employee_number: string;
  name: string;
  position: string;
  nationality: string;
  phone: string;
  rig: string;
  is_suspended?: boolean;
}

export type TravelMode = 'road_half_fly' | 'fly' | 'car';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type VacationStatus = 'pending' | 'approved' | 'denied';
export type EmployeeRequestStatus = 'pending' | 'approved' | 'denied';

export interface CpoRequest {
  id: string;
  employee_number: string;
  employee_name: string;
  grade: string;
  nationality: string;
  destination: string;
  final_destination: string;
  route_stops: string[];
  travel_mode: TravelMode;
  flight_ticket_confirmed: boolean;
  hotel_confirmed: boolean;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  rig: string;
}

export interface VacationRequest {
  id: string;
  employee_number: string;
  employee_name: string;
  rig: string;
  requested_by: string;
  status: VacationStatus;
  destination: string | null;
  travel_mode: string | null;
  flight_ticket_confirmed: boolean;
  hotel_confirmed: boolean;
  route_stops: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeRequest {
  id: string;
  name: string;
  employee_number: string;
  position: string | null;
  nationality: string | null;
  rig: string;
  requested_by: string;
  status: EmployeeRequestStatus;
  created_at: string;
  updated_at: string;
}
