<template>
  <div
    v-if="!apiLoading"
    class="min-h-screen p-4 font-legible"
    :class="dayAttributes.class"
  >
    <h1 :title="dayAttributes.title" class="text-4xl font-bold">
      {{ dayAttributes.header }}
    </h1>
    <div class="my-4">
      <fieldset class="border border-gray-300 p-4 rounded">
        <legend class="font-semibold">{{ dayAttributes.legend }}</legend>
        <div class="flex flex-wrap gap-4">
          <!-- Added flex, flex-wrap, and gap -->
          <label
            v-for="(staff, index) in allStaff"
            :key="index"
            class="flex items-center"
          >
            <input
              type="checkbox"
              v-model="checkedStaff"
              :id="staff.name"
              :name="staff.name"
              :value="staff"
              class="mr-2"
            />{{ staff.name }}
          </label>
        </div>
      </fieldset>
    </div>

    <div>
      <div v-if="checkedStaff.length" class="mt-6" ref="selectedStaff">
        <h2 class="text-2xl font-semibold">
          {{ dayAttributes.selectedStaffHeader }}
        </h2>
        <button
          @click="allFlash"
          class="bg-white text-black border border-black py-2 px-4 rounded hover:bg-black hover:text-white transition-colors duration-200 mt-2"
        >
          <span>{{ dayAttributes.selectedStaffButton }}</span>
        </button>
      </div>
      <div v-if="currentStaff.name !== ''" class="mt-4">
        <p class="text-lg">
          {{ dayAttributes.currentStaffMessage }}
          <em>{{ currentStaff.name }}</em>
        </p>
        <div class="flex items-center">
          <img
            @click="playTheme(currentStaff)"
            class="w-64 h-64 rounded-full grayscale object-cover shadow-lg"
            :src="dayAttributes.currentStaffImage"
          />
          <div class="ml-4" v-html="currentStaffWeekRepresentation"></div>
        </div>
      </div>
      <div v-if="checkedStaff.length" class="mt-6">
        <h2 class="text-2xl font-semibold" ref="staff">
          {{ dayAttributes.staffHeader }}
        </h2>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-2"
        >
          <div
            v-for="(staff, index) in checkedStaff"
            :key="index"
            class="p-4 shadow-lg rounded overflow-hidden"
            :style="{ backgroundColor: staff.color }"
          >
            <!-- Wrapping the image in a div to apply the pulse effect -->
            <div
              :class="{ 'animate-custom-pulse': staff.flash }"
              class="p-2 rounded-full"
            >
              <img
                class="w-full h-64 object-cover rounded"
                :src="staff.image"
              />
            </div>
            <div
              class="text-center mb-2 font-semibold uppercase tracking-wider"
            >
              {{ staff.name }}
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!checkedStaff.length" class="mt-6">
        <h2 v-if="announcementQueryParam" class="text-2xl font-semibold">
          Announcement: {{ announcementQueryParam }}
        </h2>

        <!-- Flexbox layout with wrap and space between buttons -->
        <div class="flex flex-wrap gap-4">
          <button
            @click="playAnnouncements"
            class="bg-white text-black border border-black py-2 px-4 rounded hover:bg-black hover:text-white transition-colors duration-200"
          >
            Any announcements or PR reviews for projects without a standup?
          </button>
          <button
            @click="slackBgSound.pause()"
            class="bg-white text-black border border-black py-2 px-4 rounded hover:bg-black hover:text-white transition-colors duration-200"
          >
            Stop audio
          </button>
          <button
            @click="pickRandomTechStaff"
            class="bg-white text-black border border-black py-2 px-4 rounded hover:bg-black hover:text-white transition-colors duration-200"
          >
            PR Requestee
          </button>
          <button
            @click="restart"
            class="bg-white text-black border border-black py-2 px-4 rounded hover:bg-black hover:text-white transition-colors duration-200"
          >
            Go again (reset)
          </button>
        </div>

        <div v-if="techPerson.name" class="mt-4">
          <p class="text-lg">
            <em>{{ techPerson.name }}</em>
          </p>
          <img
            @click="playTheme(techPerson)"
            class="w-64 h-64 rounded-full object-cover shadow-lg"
            :src="techPerson.image"
          />
        </div>
      </div>
    </div>
    <div class="mt-8">
      <h3 class="text-lg font-semibold">Key</h3>
      <ul class="space-y-2">
        <li>
          <span class="text-red-500 font-bold underline">✗</span> - No time
          entry for the day
        </li>
        <li>
          <span class="text-orange-500 font-bold underline">○</span> - Less than
          four hours of time logged
        </li>
        <li>
          <span class="text-green-500 font-bold underline">✓</span> - Time entry
          exists and more than four hours logged
        </li>
        <li><span class="text-gray-500">-</span> - Not scheduled to work</li>
      </ul>
    </div>
  </div>

  <div v-else>Reticulating splines…</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import fetchStaffAPI from "@/api";
import { Staff, WeekReport, WeekReportsData } from "@/interfaces";
import PokeAPI from "pokeapi-typescript";
import { Fireworks } from "fireworks-js";

@Component
export default class App extends Vue {
  allStaff = {} as Staff[];
  checkedStaff = {} as Staff[];
  blankStaff = {
    name: "",
    initials: "",
    flash: false,
    image: "",
    daysWorked: [],
    tech: false,
    color: "#FFFFFF",
    weekReports: [
      {
        date: "",
        hasEntry: false,
        lessThanFullDay: false,
      },
    ],
  };
  currentStaff: Staff = this.blankStaff;
  techPerson: Staff = this.blankStaff;
  techStaff: Staff[] = [];
  currentStaffPokemonImage = "";
  currentStaffPokemonName = "";
  apiLoading = true;
  announcementsSound = new Audio("/sounds/announcements.mp3");
  MAX_POKEMON_ID = 151;
  FLASH_DELAY = 200;

  get dayAttributes() {
    const defaultAttributes = {
      class: "",
      title: "Staff spinner",
      header: "Staff spinner",
      legend: "Who is in today?",
      bgSound: "/sounds/bg.mp3",
      slackBgSound: "/sounds/slackbg.mp3",
      selectedStaffHeader: "Spin2win",
      selectedStaffButton: "Next up",
      currentStaffMessage: "You're up",
      currentStaffImage: this.currentStaff.image,
      staffHeader: "Humans2go",
    };
    if (this.isTodayHallooween) {
      return {
        ...defaultAttributes,
        class: "halloween",
        header: "HAPPY HALLOWEEN",
        legend: "Ghouls",
        selectedStaffHeader: "Who dares speak their truth?",
        staffHeader: "Lurking in the dark",
        bgSound: "/sounds/monstermash.mp3",
      };
    }
    if (this.isTodayStarWarsDay) {
      return {
        ...defaultAttributes,
        class: "starwars",
        legend: "Who are the droids we're looking for?",
        bgSound: "/sounds/cantina.mp3",
        slackBgSound: "/sounds/starwars-theme.mp3",
        currentStaffMessage:
          "Help me, " + this.currentStaff.name + ". You’re my only hope.",
        staffHeader: "Jedi Scum",
      };
    }
    if (this.isTodayPokemonDay) {
      return {
        ...defaultAttributes,
        class: "pokemon",
        legend: "Team Cogapp, blasting off again!",
        bgSound: "/sounds/pokemon-battle.mp3",
        slackBgSound: "/sounds/pokemon-intro.mp3",
        selectedStaffHeader: "Will you switch your Pokémon?",
        currentStaffMessage:
          "Ash sent out " + this.currentStaffPokemonName.toUpperCase(),
        currentStaffImage: this.currentStaffPokemonImage,
        staffHeader: "Pokémon Team",
        selectedStaffButton: "YES",
      };
    }
    if (this.isTodayXmasParty) {
      return {
        ...defaultAttributes,
        class: "xmas",
        bgSound: "/sounds/xmas.mp3",
      };
    }
    if (this.isTodayBonfireNight) {
      return {
        ...defaultAttributes,
        class: "bonfire",
        header: "Bonfire Night",
        bgSound: "/sounds/bonfire.mp3",
      };
    }
    return defaultAttributes;
  }

  get currentStaffWeekRepresentation(): string {
    if (
      !this.currentStaff.weekReports ||
      this.currentStaff.weekReports.length === 0
    ) {
      return "";
    }

    const formatDay = (report: WeekReport, day: string) => {
      if (!this.currentStaff.daysWorked.includes(day)) {
        return '<span class="text-gray-500">-</span>'; // Display grey '-' for days not worked
      }

      // Show '✗' if no entry exists
      if (!report.hasEntry) {
        return '<span class="text-red-500 font-bold underline">✗</span>'; // Red '✗' for no entry
      }

      // Show circle if less than two hours
      if (report.lessThanFullDay) {
        return '<span class="text-orange-500 font-bold underline">○</span>'; // Orange circle if less than two hours
      }

      // Show tick if entry exists and more than two hours
      return '<span class="text-green-500 font-bold underline">✓</span>'; // Green tick for more than two hours
    };

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    const lastWeekReports = this.currentStaff.weekReports
      .slice(0, 5)
      .map((report, index) => formatDay(report, daysOfWeek[index]))
      .join(" ");

    const thisWeekReports = this.currentStaff.weekReports
      .slice(5)
      .map((report, index) => formatDay(report, daysOfWeek[index]))
      .join(" ");

    return `
      <div class="week-label">Last week: ${lastWeekReports}</div>
      <div class="week-label">This week: ${thisWeekReports}</div>
    `;
  }

  bgSound: HTMLAudioElement | null = null;

  get slackBgSound(): HTMLAudioElement {
    return new Audio(this.dayAttributes.slackBgSound);
  }

  mounted(): void {
    this.bgSound = new Audio(this.dayAttributes.bgSound);
    this.bgSound.loop = true;
    this.getStaff();
  }

  get dayString(): string {
    let current = new Date();
    return current.toLocaleDateString("en-GB", { weekday: "long" });
  }

  get isTodayStarWarsDay(): boolean {
    if (this.whimsyQueryParam === "starwars") {
      return true;
    }
    const today = new Date();
    return today.getMonth() === 4 && today.getDate() === 4;
  }

  get isTodayXmasParty(): boolean {
    if (this.whimsyQueryParam === "xmas") {
      return true;
    }
    const today = new Date();
    return today.getMonth() === 11 && today.getDate() === 8;
  }

  get isTodayPokemonDay(): boolean {
    if (this.whimsyQueryParam === "pokemon") {
      return true;
    }

    const today = new Date();
    return today.getMonth() === 1 && today.getDate() === 27;
  }

  get isTodayHallooween(): boolean {
    if (this.whimsyQueryParam === "boo") {
      return true;
    }
    const today = new Date();
    return today.getMonth() === 9 && today.getDate() === 31;
  }

  get isTodayBonfireNight(): boolean {
    if (this.whimsyQueryParam === "bonfire") {
      return true;
    }
    const today = new Date();
    return today.getMonth() === 10 && today.getDate() === 5;
  }

  get whimsyQueryParam(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("whimsy");
  }

  get announcementQueryParam(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("announcement");
  }

  pickStaff(): void {
    let randomStaff: Staff =
      this.checkedStaff[Math.floor(Math.random() * this.checkedStaff.length)];
    this.currentStaff = randomStaff;
    if (this.isTodayPokemonDay) {
      this.getPokemonImage(this.currentStaff.name);
    }
    let filteredStaff: Staff[] = this.checkedStaff.filter(function (name) {
      return name !== randomStaff;
    });
    this.checkedStaff = filteredStaff;
    this.scrollToSelectedStaff();
    this.playTheme(randomStaff);

    if (this.isTodayBonfireNight) {
      const fireworks = new Fireworks({
        target: this.$el,
        hue: { min: 0, max: 360 },
        delay: { min: 15, max: 30 },
        rocketsPoint: { min: 50, max: 50 },
        speed: 2,
        acceleration: 1.05,
        friction: 0.95,
        gravity: 1.5,
        particles: 50,
        trace: 3,
        explosion: 5,
        boundaries: {
          x: 50,
          y: 50,
          width: this.$el.clientWidth,
          height: this.$el.clientHeight,
        },
        sound: {
          enable: true,
          list: [
            "explosion0.mp3",
            "explosion1.mp3",
            "explosion2.mp3",
          ],
          min: 4,
          max: 8,
        },
      });
      fireworks.start();
      setTimeout(() => fireworks.stop(), 5000);
    }
  }

  restart(): void {
    this.checkedStaff = this.allStaff;
    this.currentStaff = this.blankStaff;
    if (this.bgSound) {
      this.bgSound.pause();
    }
  }
  playTheme(staffName: Staff): void {
    let sound = new Audio(`/sounds/${staffName.sound}`);
    sound.volume = 1;
    sound.play();
  }
  allFlash(): void {
    if (!this.bgSound) return; // Ensure bgSound is initialized
    this.bgSound.play();

    let index = 0;
    const cycleInterval = 200; // Time in milliseconds for cycling through each staff
    const totalCycles = 1; // Number of times to cycle through the entire list before stopping
    let cycleCount = 0;

    // Interval to go through each staff member in the checkedStaff array
    const interval = setInterval(() => {
      // Reset flash for all staff
      this.checkedStaff.forEach((staffMember) => {
        staffMember.flash = false;
      });

      // Set flash for the current staff member
      console.log("Flashing:", this.checkedStaff[index].name); // Add this line
      this.checkedStaff[index].flash = true;

      // Move to the next staff member
      index = (index + 1) % this.checkedStaff.length;

      // Check if we have cycled through enough times
      if (index === 0) {
        cycleCount++;
      }

      // Stop the cycling after a certain number of cycles
      if (cycleCount >= totalCycles) {
        clearInterval(interval);
        console.log("end");
        // Pick the final staff member to land on
        this.pickStaff();

        // Remove the flashing effect and stop the background sound
        setTimeout(() => {
          this.removeFlashClass();
          if (this.bgSound) {
            this.bgSound.pause();
          }
        }, this.FLASH_DELAY);
      }
    }, cycleInterval);
  }

  removeFlashClass(): void {
    this.checkedStaff.forEach((staffMember: Staff) => {
      staffMember.flash = false;
    });
  }
  async getStaff(): Promise<void> {
    try {
      const staffResponse = await fetchStaffAPI.fetchStaff();
      this.allStaff = staffResponse.map((staff) => ({
        ...staff,
        color: staff.color || this.randomColour(),
      }));
      await this.addWeekReports();
      this.filterStaffByDay();
      this.filterTechStaff();
      this.apiLoading = false;
    } catch (error) {
      console.error("Error fetching staff or week reports:", error);
    }
  }

  async addWeekReports(): Promise<void> {
    try {
      const weekReportsResponse = await fetch(
        "http://localhost:3000/api/missing-time-report-entries"
      );
      if (weekReportsResponse.ok) {
        const weekReportsData: WeekReportsData[] =
          await weekReportsResponse.json();
        this.allStaff = this.allStaff.map((staff) => ({
          ...staff,
          weekReports:
            weekReportsData.find(
              (weekReportData) => weekReportData.initials === staff.initials
            )?.weekReports || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching week reports:", error);
    }
  }

  filterStaffByDay(): void {
    const today = new Date();
    const isFriday = today.getDay() === 5; // 5 represents Friday in getDay()

    // Helper function to check if it's Nitin's working Friday
    const isNitinWorkingThisFriday = (): boolean => {
      const startOfYear = new Date(today.getFullYear(), 0, 1); // Jan 1st
      const weekNumber = Math.ceil(
        ((today.getTime() - startOfYear.getTime()) / 86400000 +
          startOfYear.getDay() +
          1) /
          7
      );

      return weekNumber % 2 === 1; // Assuming Nitin works on odd-numbered weeks
    };

    this.checkedStaff = this.allStaff.filter((staffMember) => {
      if (staffMember.name === "Nitin" && isFriday) {
        return isNitinWorkingThisFriday(); // Only include Nitin if it's his working Friday
      }
      return staffMember.daysWorked.includes(this.dayString);
    });
  }

  filterTechStaff(): void {
    this.techStaff = this.allStaff.filter((staffMember) => staffMember.tech);
  }

  getPokemonImage(name: string): void {
    const seed = name
      .split("")
      .map((char) => char.charCodeAt(0))
      .reduce((acc, val) => acc + val, 0);
    const randomNumber =
      Math.floor(Math.abs(Math.sin(seed)) * this.MAX_POKEMON_ID) + 1;
    PokeAPI.Pokemon.resolve(randomNumber).then((result) => {
      this.currentStaffPokemonImage = result.sprites.front_default;
      this.currentStaffPokemonName = result.name;
    });
  }

  randomColour(): string {
    const getBalancedColour = () => {
      // Generate R, G, B values that ensure the color is light but not too light
      const r = Math.floor(150 + Math.random() * 85); // R between 150-235
      const g = Math.floor(150 + Math.random() * 85); // G between 150-235
      const b = Math.floor(150 + Math.random() * 85); // B between 150-235

      return `rgb(${r}, ${g}, ${b})`;
    };

    return getBalancedColour();
  }

  scrollToStaff(): void {
    const selectedStaffElement = this.$refs.staff as HTMLElement;
    if (selectedStaffElement) {
      selectedStaffElement.scrollIntoView({ behavior: "smooth" });
    }
  }
  scrollToSelectedStaff(): void {
    const selectedStaffElement = this.$refs.selectedStaff as HTMLElement;
    if (selectedStaffElement) {
      selectedStaffElement.scrollIntoView({ behavior: "smooth" });
    }
  }
  playAnnouncements(): void {
    this.announcementsSound.play();
    this.slackBgSound.play();
  }

  pickRandomTechStaff(): void {
    // Filter out the currently selected tech person
    const filteredTechStaff = this.techStaff.filter(
      (staff) => staff.name !== this.techPerson.name
    );

    if (filteredTechStaff.length === 0) {
      // Reset the list if all tech staff have been picked
      this.techStaff = this.allStaff.filter((staff) => staff.tech);
      return;
    }

    const randomIndex = Math.floor(Math.random() * filteredTechStaff.length);
    this.techPerson = filteredTechStaff[randomIndex];

    // Update the techStaff array to exclude the picked staff member
    this.techStaff = filteredTechStaff;
  }
}
</script>
