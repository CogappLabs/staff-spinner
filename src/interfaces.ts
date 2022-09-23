export interface Staff {
  name: string;
  flash: boolean;
  image: string;
  sound?: string;
  daysWorked: Array<string>;
}

export interface staffResponse {
  data: { staff: Staff[] };
}
