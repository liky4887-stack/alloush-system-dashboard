export type Tab = 'overview' | 'crew-change' | 'employees';

export interface Rig {
  id: string;
  label: string;
  total: number;
  suspended: number;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
  nationality: string;
  contact: string;
  rig: string;
}

export interface CpoRequest {
  id: string;
  employee_number: string;
  grade: string;
  nationality: string;
  destination: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';
