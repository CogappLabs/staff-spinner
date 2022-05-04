<template>
  <div
    v-if="!apiLoading"
    class="site-wrapper"
    :class="{ starwars: isTodayStarWarsDay }"
  >
    <h1>Staff spinner</h1>
    <div class="fieldset-container">
      <fieldset>
        <legend v-if="!isTodayStarWarsDay">Who is in today?</legend>
        <legend v-else>Who are the droids we're looking for?</legend>

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
        <h2>Spin2win</h2>
        <button @click="allFlash">Next up</button>
      </div>
      <div v-if="currentStaff.name != ''" class="container">
        <p v-if="!isTodayStarWarsDay">
          You're up <em>{{ currentStaff.name }}</em>
        </p>
        <p v-else>
          Help me, <em>{{ currentStaff.name }}</em
          >. You’re my only hope.
        </p>
        <img
          @click="playTheme(currentStaff)"
          class="lone-img"
          :src="currentStaff.image"
        />
      </div>
      <div class="container" v-if="checkedStaff.length">
        <h2 ref="staff" v-if="!isTodayStarWarsDay">Humans2go</h2>
        <h2 v-else>Jedi Scum</h2>
        <div class="grid-wrapper">
          <div
            v-for="(staff, index) in checkedStaff"
            v-bind:key="index"
            class="grid-img-wrapper"
            :style="{ backgroundColor: randomColor() }"
          >
            <div class="grid-img-name">{{ staff.name }}</div>
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
import { Component, Vue } from 'vue-property-decorator';
import fetchStaffAPI from '@/api';
import { Staff } from '@/interfaces';

@Component
export default class App extends Vue {
  allStaff = {} as Staff[];
  checkedStaff = {} as Staff[];
  blankStaff = { name: '', flash: false, image: '' };
  currentStaff: Staff = this.blankStaff;
  apiLoading = true;
  announcementsSound = new Audio('/sounds/announcements.mp3');

  get bgSound(): HTMLAudioElement {
    if (this.isTodayStarWarsDay) {
      return new Audio('/sounds/cantina.mp3');
    }
    return new Audio('/sounds/bg.mp3');
  }

  get slackBgSound(): HTMLAudioElement {
    if (this.isTodayStarWarsDay) {
      return new Audio('/sounds/starwars-theme.mp3');
    }
    return new Audio('/sounds/slackbg.mp3');
  }
  mounted(): void {
    this.getStaff();
  }

  get isTodayFriday(): boolean {
    const today = new Date();
    const day = today.getDay();
    return day === 5;
  }

  get isTodayStarWarsDay(): boolean {
    const today = new Date();
    return today.getMonth() === 4 && today.getDate() === 4;
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
      this.checkedStaff = response;
      this.apiLoading = false;
    });
  }
  randomColor(): string {
    let randomColour = '#' + ((Math.random() * 0xffffff) << 0).toString(16);
    return randomColour;
  }
  scrollToStaff(): void {
    const el = this.$refs.staff as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
  scrollToSelectedStaff(): void {
    const el = this.$refs.selectedStaff as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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
  font-family: 'MajorMonoDisplay';
  padding: 1rem;
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
  font-family: 'MajorMonoDisplay';
  font-weight: 400;
  font-style: normal;
  font-display: auto;
  unicode-range: U+000-5FF;
  src: local('MajorMonoDisplay'),
    url('/fonts/MajorMonoDisplay-Regular.ttf') format('truetype');
}

@font-face {
  font-family: 'star jedi';
  font-weight: 400;
  font-style: normal;
  font-display: auto;
  src: url('/fonts/star_jedi/starjedi/Starjedi.ttf') format('truetype');
}

@font-face {
  font-family: 'star jedi outline';
  font-weight: 400;
  font-style: normal;
  font-display: auto;
  src: url('/fonts/star_jedi/starjedi/Starjhol.ttf') format('truetype');
}

.starwars {
  font-family: 'star jedi';
  letter-spacing: 0.1rem;
  background-color: #000;
  color: #ffe81f;
  accent-color: white;
  background-image: url('/images/star-wars-stars.jpg');
}

.starwars > h1 {
  margin-top: 0;
  font-family: 'star jedi outline';
  font-size: 4rem;
  font-weight: 300;
  text-align: center;
}

.starwars .grid-img-name {
  text-shadow: 0px 0px 4px black;
}
</style>
