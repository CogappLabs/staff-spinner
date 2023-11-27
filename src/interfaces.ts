export interface Staff {
  name: string;
  flash: boolean;
  image: string;
  sound?: string;
  daysWorked: string[];
  tech: boolean;
}

export interface staffResponse {
  data: { staff: Staff[] };
}
