<template>
  <div
    v-if="!apiLoading"
    class="site-wrapper"
    :class="{
      starwars: isTodayStarWarsDay,
      pokemon: isTodayPokemonDay,
    }"
  >
    <h1 title="Staff spinner">Staff spinner</h1>
    <div class="fieldset-container">
      <fieldset>
        <legend v-if="isTodayStarWarsDay">
          Who are the droids we're looking for?
        </legend>
        <legend v-else-if="isTodayPokemonDay">
          Team Cogapp, blasting off again!
        </legend>
        <legend v-else>Who is in today?</legend>

        <label v-for="(staff, index) in allStaff" v-bind:key="index"
          ><input
            type="checkbox"
            v-model="checkedStaff"
            :id="staff"
            :name="staff"
            :value="staff"
          />{{ staff.name }}</label
        >
      </fieldset>
    </div>
    <div>
      <div class="container" v-if="checkedStaff.length" ref="selectedStaff">
        <h2 v-if="isTodayPokemonDay">Will you switch your Pokémon?</h2>
        <h2 v-else>Spin2win</h2>
        <button @click="allFlash">
          <span v-if="isTodayPokemonDay">YES</span>
          <span v-else>Next up</span>
        </button>
      </div>
      <div v-if="currentStaff.name != ''" class="container">
        <p v-if="isTodayStarWarsDay">
          Help me, <em>{{ currentStaff.name }}</em
          >. You’re my only hope.
        </p>
        <p v-else-if="isTodayPokemonDay">
          Ash sent out <em>{{ currentStaff.name.toUpperCase() }}</em>
        </p>
        <p v-else>
          You're up <em>{{ currentStaff.name }}</em>
        </p>
        <img
          v-if="isTodayPokemonDay"
          @click="playTheme(currentStaff)"
          class="lone-img"
          :src="this.currentStaffPokemonImage"
        />
        <img
          v-else
          @click="playTheme(currentStaff)"
          class="lone-img"
          :src="currentStaff.image"
        />
      </div>
      <div class="container" v-if="checkedStaff.length">
        <h2 ref="staff" v-if="isTodayStarWarsDay">Jedi Scum</h2>
        <h2 ref="staff" v-else-if="isTodayPokemonDay">Pokémon Team</h2>
        <h2 ref="staff" v-else>Humans2go</h2>
        <div class="grid-wrapper">
          <div
            v-for="(staff, index) in checkedStaff"
            v-bind:key="index"
            class="grid-img-wrapper"
            :style="{ backgroundColor: randomColor() }"
          >
            <div class="grid-img-name">
              {{ staff.name }}
            </div>
            <img
              class="grid-img"
              :class="{ 'grid-img-animate': staff.flash }"
              :id="index"
              :src="staff.image"
            />
          </div>
        </div>
      </div>
      <div v-else-if="!checkedStaff.length" class="container">
        <button @click="playAnnouncements">Any announcements?</button>
        <button @click="slackBgSound.pause()">Stop audio</button>
        <button @click="restart">Go again (reset)</button>
        <p v-if="isTodayFriday">
          Friday is a special day… Please do your TRS
          <span class="trs-days">X</span>&nbsp;<span class="trs-days">X</span
          >&nbsp;<span class="trs-days">X</span>&nbsp;<span class="trs-days"
            >X</span
          >&nbsp;<span class="trs-days">today</span>
        </p>
      </div>
    </div>
  </div>
  <div v-else>Reticulating splines…</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import fetchStaffAPI from "@/api";
import { Staff } from "@/interfaces";
import PokeAPI from "pokeapi-typescript";

@Component
export default class App extends Vue {
  allStaff = {} as Staff[];
  checkedStaff = {} as Staff[];
  blankStaff = { name: "", flash: false, image: "", daysWorked: [] };
  currentStaff: Staff = this.blankStaff;
  currentStaffPokemonImage = "";
  apiLoading = true;
  announcementsSound = new Audio("/sounds/announcements.mp3");

  get bgSound(): HTMLAudioElement {
    if (this.isTodayStarWarsDay) {
      return new Audio("/sounds/cantina.mp3");
    }

    if (this.isTodayXmasParty) {
      return new Audio("/sounds/xmas.mp3");
    }

    if (this.isTodayPokemonDay) {
      return new Audio("/sounds/pokemon-battle.mp3");
    }

    return new Audio("/sounds/bg.mp3");
  }

  get slackBgSound(): HTMLAudioElement {
    if (this.isTodayStarWarsDay) {
      return new Audio("/sounds/starwars-theme.mp3");
    }

    if (this.isTodayPokemonDay) {
      return new Audio("/sounds/pokemon-intro.mp3");
    }

    return new Audio("/sounds/slackbg.mp3");
  }

  mounted(): void {
    this.getStaff();
  }

  get dayString(): string {
    let current = new Date();
    return current.toLocaleDateString("en-GB", { weekday: "long" });
  }

  get isTodayFriday(): boolean {
    return this.dayString === "Friday";
  }

  get isTodayStarWarsDay(): boolean {
    if (this.whimsyQueryParam === "starwars") {
      return true;
    }
    const today = new Date();
    return today.getMonth() === 4 && today.getDate() === 4;
  }

  get isTodayXmasParty(): boolean {
    const today = new Date();
    return today.getMonth() === 11 && today.getDate() === 16;
  }

  get isTodayPokemonDay(): boolean {
    if (this.whimsyQueryParam === "pokemon") {
      return true;
    }

    const today = new Date();
    return today.getMonth() === 1 && today.getDate() === 27;
  }

  get whimsyQueryParam(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("whimsy");
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
    fetchStaffAPI.fetchStaff().then((response) => {
      this.allStaff = response;
      this.checkedStaff = response.filter((staffMember) =>
        staffMember.daysWorked.includes(this.dayString)
      );
      this.apiLoading = false;
    });
  }

  getPokemonImage(name: string): void {
    const seed = name
      .split("")
      .map((char) => char.charCodeAt(0))
      .reduce((acc, val) => acc + val, 0);
    const randomNumber = Math.floor(Math.abs(Math.sin(seed)) * 151) + 1;
    PokeAPI.Pokemon.resolve(randomNumber).then(
      (result) => (this.currentStaffPokemonImage = result.sprites.front_default)
    );
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
}
</script>

<style scoped>
@import "@/main.css";
</style>
