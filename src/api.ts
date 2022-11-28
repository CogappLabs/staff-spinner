import { staffResponse, Staff } from "@/interfaces";

const requestOptions = {
  method: "GET",
  headers: { "Content-Type": "application/json" },
};

export default {
  async fetchStaff(): Promise<Staff[]> {
    const response = await fetch("/staff.json", requestOptions);
    if (response.status !== 200) throw new Error(response.statusText);
    const { data } = (await response.json()) as staffResponse;
    return data.staff;
  },
};
