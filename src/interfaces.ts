export interface Staff {
  name: string;
  initials: string;
  flash: boolean;
  image: string;
  sound?: string;
  daysWorked: string[];
  tech: boolean;
  weekReports: WeekReport[];
}

export interface WeekReport {
  date: string;
  hasEntry: boolean;
}

export interface staffResponse {
  data: { staff: Staff[] };
}
