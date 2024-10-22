export interface Staff {
  name: string;
  initials: string;
  flash: boolean;
  image: string;
  sound?: string;
  daysWorked: string[];
  tech: boolean;
  weekReports: WeekReport[];
  color: string;
}

export interface WeekReport {
  date: string;
  hasEntry: boolean;
  lessThanFullDay: boolean;
}

export interface WeekReportsData {
  initials: string;
  weekReports: WeekReport[];
}

export interface staffResponse {
  data: { staff: Staff[] };
}
