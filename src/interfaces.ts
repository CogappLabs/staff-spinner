export interface Staff {
  name: string;
  flash: boolean;
  image: string;
  sound?: string;
}

export interface staffResponse {
  data: { staff: Staff[] };
}
