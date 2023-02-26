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

@Component
export default class App extends Vue {
  allStaff = {} as Staff[];
  checkedStaff = {} as Staff[];
  blankStaff = { name: "", flash: false, image: "", daysWorked: [] };
  currentStaff: Staff = this.blankStaff;
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
      // this.checkedStaff = response;
      this.checkedStaff = response.filter((staffMember) =>
        staffMember.daysWorked.includes(this.dayString)
      );
      this.apiLoading = false;
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
}
</script>

<style scoped>
.site-wrapper {
  font-family: "MajorMonoDisplay";
  padding: 1rem;
  min-height: 100vh;
}

label {
  font-family: monospace;
  /* padding-right: 1em; */
  display: block;
  margin-bottom: 5px;
  font-size: 16px;
  float: left;
  width: 10%;
  margin-left: 18px;
}

button {
  padding: 0.35em 1.2em;
  border: 0.1em solid black;
  margin: 0 0.3em 0.3em 0;
  border-radius: 0.12em;
  color: black;
  font-size: 1.5em;
  cursor: pointer;
}

button:hover {
  color: rgb(68, 0, 255);
  border-color: rgb(68, 0, 255);
}

.grid-wrapper {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(4, 200px);
  grid-gap: 3.5em 1em;
}
.grid-img {
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.trs-days {
  color: #ff0000;
  text-decoration: underline;
  font-weight: bold;
  font-family: arial, helvetica, sans-serif;
  font-size: 10pt;
}

.grid-img-animate {
  animation: grid-image 0.1s 2;
  animation-direction: alternate;
}

.grid-img-name {
  text-align: center;
  padding: 10px 20px;
}

@keyframes grid-image {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
.lone-img {
  height: 200px;
  object-fit: cover;
  border-radius: 50%;
  filter: grayscale(100%);
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}
.container {
  padding-top: 15px;
}
em {
  font-weight: bold;
}
.animate {
  width: 100px;
  height: 100px;
  border: 1px solid;
  border-color: red;
}
@font-face {
  font-family: "MajorMonoDisplay";
  font-weight: 400;
  font-style: normal;
  font-display: auto;
  unicode-range: U+000-5FF;
  src: local("MajorMonoDisplay"),
    url("fonts/MajorMonoDisplay-Regular.ttf") format("truetype");
}

@font-face {
  font-family: "star jedi";
  font-weight: 400;
  font-style: normal;
  font-display: auto;
  src: url("fonts/star_jedi/starjedi/Starjedi.ttf") format("truetype");
}

@font-face {
  font-family: "star jedi outline";
  font-weight: 400;
  font-style: normal;
  font-display: auto;
  src: url("fonts/star_jedi/starjedi/Starjhol.ttf") format("truetype");
}

@font-face {
  font-family: "pokemon solid";
  font-weight: 400;
  font-style: normal;
  font-display: auto;
  src: url("fonts/pokemon/Pokemon Solid.ttf") format("truetype")
}

@font-face {
  font-family: "pokemon hollow";
  font-weight: 400;
  font-style: normal;
  font-display: auto;
  src: url("fonts/pokemon/Pokemon Hollow.ttf") format("truetype")
}

@font-face {
  font-family: "pokemon interface";
  font-weight: 400;
  font-style: normal;
  font-display: auto;
  src: url("fonts/pokemon_classic/Pokemon Classic.ttf") format("truetype")
}

/* STAR WARS DAY */
.starwars {
  font-family: "star jedi";
  letter-spacing: 0.1rem;
  background-color: #000;
  color: #ffe81f;
  accent-color: white;
  background-image: url("assets/star-wars-stars.jpg");
}

.starwars > h1 {
  margin-top: 0;
  font-family: "star jedi outline";
  font-size: 4rem;
  font-weight: 300;
  text-align: center;
}

.starwars .grid-img-name {
  text-shadow: 0px 0px 4px black;
}

/* POKEMON DAY */
.pokemon {
  font-family: "pokemon interface";
  letter-spacing: 0.1rem;
  background-color: #9bbc0f;
  color: #0f380f;
  accent-color: white;
}

.pokemon h1 {
  font-family: "pokemon solid";
  color: #ffcb05;
  color: #8bac0f;
  font-size: 4rem;
  position: relative;
  text-align: center;
}

.pokemon h1::before {
  content: attr(title);
  font-family: "pokemon hollow";
  position: absolute;
  color: #3c5aa6;
  color: #0f380f;
  top: 0;
}

.pokemon fieldset {
  border: 2px solid currentColor;
}

.pokemon .grid-img-wrapper,
.pokemon .lone-img {
  filter: sepia(1) hue-rotate(40deg);
}

.pokemon .grid-image {
  box-shadow: unset;
}

.pokemon
.pokemon button {
  appearance: none;
  border: 2px solid currentColor;
  box-shadow: 0px 0px 0px 1px #9bbc0f, 0px 0px 0px 2px currentColor,
    0px 0px 0px 4px currentColor;
  background-color: transparent;
  color: currentColor;
  position: relative;
  font-family: unset;
  font-size: 1.2rem;
}

.pokemon button:focus,
.pokemon button:hover {
  background-image: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBVcGxvYWRlZCB0bzogU1ZHIFJlcG8sIHd3dy5zdmdyZXBvLmNvbSwgR2VuZXJhdG9yOiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIGZpbGw9IiMwMDAwMDAiIHZlcnNpb249IjEuMSIgaWQ9IkNhcGFfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgDQoJIHdpZHRoPSI4MDBweCIgaGVpZ2h0PSI4MDBweCIgdmlld0JveD0iMCAwIDk2LjE1NSA5Ni4xNTUiDQoJIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPHBhdGggZD0iTTIwLjk3Miw5NS41OTRsNTcuNjA1LTQ1Ljk1MWMwLjk1MS0wLjc2LDAuOTUxLTIuMzY3LDAtMy4xMjdMMjAuOTY4LDAuNTZjLTAuNjg5LTAuNTQ3LTEuNzE2LTAuNzA5LTIuNjEtMC40MTQNCgkJYy0wLjE4NiwwLjA2MS0wLjMzLDAuMTI5LTAuNDM2LDAuMTg2Yy0wLjY1LDAuMzUtMS4wNTYsMS4wMjUtMS4wNTYsMS43NjR2OTEuOTY3YzAsMC43MzYsMC40MDUsMS40MTQsMS4wNTYsMS43NjINCgkJYzAuMTA5LDAuMDYsMC4yNTMsMC4xMjcsMC40MjYsMC4xODVDMTkuMjUxLDk2LjMwNSwyMC4yODEsOTYuMTQ0LDIwLjk3Miw5NS41OTR6Ii8+DQo8L2c+DQo8L3N2Zz4=");
  background-size: 0.7em 0.7em;
  background-repeat: no-repeat;
  background-position: 0.4em center;
}

.pokemon button:hover {
  color: #0f380f;
}

.pokemon .container > button:not(:last-of-type) {
  margin-right: 1em;
}

.pokemon label {
  font-family: unset;
  font-size: 0.9rem;
}
</style>
