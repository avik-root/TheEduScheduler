
export interface Room {
    id: string;
    name: string;
    capacity: number;
    buildingName?: string;
    floorName?: string;
}

export interface Section {
    id: string;
    name: string;
    studentCount: number;
}

export interface Year {
    id: string;
    name: string;
    sections: Section[];
}

export interface Program {
    id: string;
    name: string;
    years: Year[];
}

export interface Department {
    id: string;
    name: string;
    programs: Program[];
}

export interface Faculty {
  name: string;
  abbreviation: string;
  email: string;
  password?: string;
  department: string;
  weeklyMaxHours: number;
  weeklyOffDays?: string[];
  isTwoFactorEnabled?: boolean;
  twoFactorPin?: string;
  twoFactorAttempts?: number;
  isLocked?: boolean;
  twoFactorDisabledByAdmin?: boolean;
  passwordLastChanged?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  type: 'Theory' | 'Lab' | 'Theory+Lab' | 'Project';
  departmentId: string;
  programId: string;
  yearId: string;
  facultyEmails?: string[];
  theoryCredits?: number;
  labCredits?: number;
}
