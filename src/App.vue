<template>
  <div v-if="!apiLoading" class="site-wrapper" :class="dayAttributes.class">
    <h1 :title="dayAttributes.title">{{ dayAttributes.header }}</h1>
    <div class="fieldset-container">
      <fieldset>
        <legend>{{ dayAttributes.legend }}</legend>
        <label v-for="(staff, index) in allStaff" :key="index">
          <input
            type="checkbox"
            v-model="checkedStaff"
            :id="staff.name"
            :name="staff.name"
            :value="staff"
          />{{ staff.name }}
        </label>
      </fieldset>
    </div>
    <div>
      <div v-if="checkedStaff.length" class="container" ref="selectedStaff">
        <h2>{{ dayAttributes.selectedStaffHeader }}</h2>
        <button @click="allFlash">
          <span>{{ dayAttributes.selectedStaffButton }}</span>
        </button>
      </div>
      <div v-if="currentStaff.name !== ''" class="container">
        <p>
          {{ dayAttributes.currentStaffMessage }}
          <em>{{ currentStaff.name }}</em>
        </p>
        <div class="image-container">
          <img
            @click="playTheme(currentStaff)"
            class="lone-img"
            :src="dayAttributes.currentStaffImage"
          />
          <div
            class="week-representation"
            v-html="currentStaffWeekRepresentation"
          ></div>
        </div>
      </div>
      <div class="container" v-if="checkedStaff.length">
        <h2 ref="staff">{{ dayAttributes.staffHeader }}</h2>
        <div class="grid-wrapper">
          <div
            v-for="(staff, index) in checkedStaff"
            :key="index"
            class="grid-img-wrapper"
            :style="{ backgroundColor: randomColor() }"
          >
            <div class="grid-img-name">
              {{ staff.name }}
            </div>
            <img
              class="grid-img"
              :class="{ 'grid-img-animate': staff.flash }"
              :src="staff.image"
            />
          </div>
        </div>
      </div>

      <div v-else-if="!checkedStaff.length" class="container">
        <h2 v-if="announcementQueryParam">
          Announcement: {{ announcementQueryParam }}
        </h2>
        <button @click="playAnnouncements">
          Any announcements or PR reviews for projects without a standup?
        </button>
        <button @click="slackBgSound.pause()">Stop audio</button>
        <button @click="pickRandomTechStaff">PR Requestee</button>
        <button @click="restart">Go again (reset)</button>
        <div v-if="techPerson.name" class="container">
          <p>
            <em>{{ techPerson.name }}</em>
          </p>
          <img
            @click="playTheme(techPerson)"
            class="lone-img"
            :src="techPerson.image"
          />
        </div>
      </div>
    </div>
  </div>

  <div v-else>Reticulating splines…</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import fetchStaffAPI from "@/api";
import { Staff, WeekReport } from "@/interfaces";
import PokeAPI from "pokeapi-typescript";

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
    weekReports: [
      {
        date: "",
        hasEntry: false,
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
          "Ash sent out " +
          this.currentStaffPokemonName.toUpperCase() +
          " (" +
          this.currentStaff.name.toUpperCase() +
          ")",
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
        return '<span class="trs-days-off">-</span>'; // Display grey '0' for days not worked
      }
      return report.hasEntry
        ? '<span class="trs-days-tick">✓</span>'
        : '<span class="trs-days">✗</span>';
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

  get bgSound(): HTMLAudioElement {
    return new Audio(this.dayAttributes.bgSound);
  }

  get slackBgSound(): HTMLAudioElement {
    return new Audio(this.dayAttributes.slackBgSound);
  }

  mounted(): void {
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
  }
  restart(): void {
    this.checkedStaff = this.allStaff;
    this.currentStaff = this.blankStaff;
    this.bgSound.pause();
  }
  playTheme(staffName: Staff): void {
    let sound = new Audio(`/sounds/${staffName.sound}`);
    sound.volume = 1;
    sound.play();
  }
  allFlash(): void {
    this.scrollToStaff();
    this.bgSound.loop = true;
    this.bgSound.play();
    this.checkedStaff.forEach(
      (staffMember: Staff, idx: number, array: Staff[]) => {
        setTimeout(() => {
          staffMember.flash = true;
          if (idx === array.length - 1) {
            setTimeout(() => {
              this.removeFlashClass();
              this.bgSound.pause();
              this.pickStaff();
            }, 200);
          }
        }, idx * 200);
      }
    );
  }
  removeFlashClass(): void {
    this.checkedStaff.forEach((staffMember: Staff) => {
      staffMember.flash = false;
    });
  }
  getStaff(): void {
    fetchStaffAPI.fetchStaff().then(async (response) => {
      this.allStaff = response;

      try {
        const weekReportsResponse = await fetch(
          "http://localhost:3000/api/missing-time-report-entries"
        );

        if (weekReportsResponse.ok) {
          const weekReportsData = await weekReportsResponse.json();
          // Combine the week reports with your existing staff data
          this.allStaff = this.allStaff.map((staff) => ({
            ...staff,
            weekReports:
              weekReportsData.find((r: any) => r.initials === staff.initials)
                ?.weekReports || [],
          }));
        }
      } catch (error) {
        // Handle the error here (e.g., log it)
        console.error("Error fetching week reports:", error);
      }

      this.checkedStaff = this.allStaff.filter((staffMember) =>
        staffMember.daysWorked.includes(this.dayString)
      );
      this.techStaff = response.filter((staffMember) => staffMember.tech);
      this.apiLoading = false;
    });
  }

  getPokemonImage(name: string): void {
    const seed = name
      .split("")
      .map((char) => char.charCodeAt(0))
      .reduce((acc, val) => acc + val, 0);
    const randomNumber = Math.floor(Math.abs(Math.sin(seed)) * 151) + 1;
    PokeAPI.Pokemon.resolve(randomNumber).then((result) => {
      this.currentStaffPokemonImage = result.sprites.front_default;
      this.currentStaffPokemonName = result.name;
    });
  }

  randomColor(): string {
    let randomColour = "#" + ((Math.random() * 0xffffff) << 0).toString(16);
    return randomColour;
  }
  scrollToStaff(): void {
    const el = this.$refs.staff as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }
  scrollToSelectedStaff(): void {
    const el = this.$refs.selectedStaff as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
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

<style scoped>
@import "@/main.css";
</style>
