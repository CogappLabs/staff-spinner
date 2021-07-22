<template>
  <div>
    <h1>Staff spinner</h1>
    <fieldset>
      <legend>Who is in today?</legend>

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
    <div>
      <div class="container" v-if="checkedStaff.length">
        <h2>Spin2win</h2>
        <button @click="allFlash">Next up</button>
      </div>
      <div v-if="currentStaff.name != ''" class="container">
        <p>
          You're up <em>{{ currentStaff.name }}</em>
        </p>
        <img class="lone-img" :src="staffImg(currentStaff.name)" />
      </div>
      <div class="container" v-if="checkedStaff.length">
        <h2>Remaining staff</h2>
        <div class="grid-wrapper">
          <div
            v-for="(staff, index) in checkedStaff"
            v-bind:key="index"
            class="grid-img-wrapper"
          >
            <img
              class="grid-img"
              :class="{ 'grid-img-animate': staff.flash }"
              :id="index"
              :ref="index"
              :src="staffImg(staff.name)"
            />
            <div class="grid-img-name">{{ staff.name }}</div>
          </div>
        </div>
      </div>
      <div v-else-if="!checkedStaff.length" class="container">
        <p>Any announcements?</p>
        <button @click="restart">Go again (reset)</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { config } from "@/config";

interface Staff {
  name: string;
  flash: boolean;
}

@Component
export default class App extends Vue {
  allStaff: Array<Staff> = config.staff;
  checkedStaff: Array<Staff> = config.staff;
  blankStaff = { name: "", flash: false };
  currentStaff: Staff = this.blankStaff;

  pickStaff(): void {
    let randomStaff: Staff =
      this.checkedStaff[Math.floor(Math.random() * this.checkedStaff.length)];
    this.currentStaff = randomStaff;
    let filteredStaff: Array<Staff> = this.checkedStaff.filter(function (name) {
      return name !== randomStaff;
    });
    this.checkedStaff = filteredStaff;
    this.playTheme(randomStaff);
  }
  staffImg(staffName: string): string {
    return `/images/${staffName}.jpg`;
  }
  restart(): void {
    this.checkedStaff = this.allStaff;
    this.currentStaff = this.blankStaff;
  }
  playTheme(staffName: Staff): void {
    let sound = new Audio(`/sounds/${staffName.name}.mp3`);
    sound.play();
  }
  allFlash(): void {
    this.checkedStaff.forEach(
      (staffMember: Staff, idx: number, array: Array<Staff>) => {
        setTimeout(() => {
          staffMember.flash = true;
          if (idx === array.length - 1) {
            setTimeout(() => {
              this.removeFlashClass();
              this.pickStaff();
            }, 2000);
          }
        }, idx * 1000);
      }
    );
  }
  removeFlashClass(): void {
    this.checkedStaff.forEach((staffMember: Staff) => {
      staffMember.flash = false;
    });
  }
}
</script>

<style scoped>
.grid-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 30vw);
  grid-gap: 15px;
}
.grid-img-wrapper {
  background-color: black;
}

.grid-img {
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.grid-img-animate {
  animation: grid-image 1s 2;
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
    opacity: 0.1;
  }
}
.lone-img {
  height: 300px;
  object-fit: cover;
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
</style>
