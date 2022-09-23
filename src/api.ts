import { config } from "@/config";
import { staffResponse, Staff } from "@/interfaces";

const allStaffQuery = `
    query {
        staff {
          name
          flash
          image
          sound
          daysWorked
        }
    }
`;

const requestOptions = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: allStaffQuery }),
};

export default {
  async fetchStaff(): Promise<Staff[]> {
    const response = await fetch(config.graphQLAPI, requestOptions);
    if (response.status !== 200) throw new Error(response.statusText);
    const { data } = (await response.json()) as staffResponse;
    return data.staff;
  },
};
