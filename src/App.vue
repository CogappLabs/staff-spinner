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
        />{{ staff }}</label
      >
    </fieldset>
    <div>
      <div class="container" v-if="checkedStaff.length">
        <h2>Spin2win</h2>
        <button @click="pickStaff">Next up</button>
      </div>
      <div v-if="currentStaff" class="container">
        <p>
          You're up <em>{{ currentStaff }}</em>
        </p>
        <img class="lone-img" :src="staffImg(currentStaff)" />
      </div>
      <div class="container" v-if="checkedStaff.length">
        <h2>Remaining staff</h2>
        <div class="grid-wrapper">
          <div v-for="(staff, index) in checkedStaff" v-bind:key="index">
            <img class="grid-img" :src="staffImg(staff)" />
            {{ staff }}
          </div>
        </div>
      </div>
      <div v-else-if="!checkedStaff.length" class="container">
        <p>Any annoucements?</p>
        <button @click="restart">Go again (reset)</button>
      </div>
    </div>
  </div>
</template>

<script>
import { config } from "@/config";

export default {
  name: "App",
  components: {},
  data: function () {
    return {
      allStaff: config.staff,
      checkedStaff: config.staff,
      currentStaff: "",
    };
  },
  methods: {
    pickStaff() {
      let randomStaff =
        this.checkedStaff[Math.floor(Math.random() * this.checkedStaff.length)];
      this.currentStaff = randomStaff;
      let filteredStaff = this.checkedStaff.filter(function (name) {
        return name !== randomStaff;
      });
      this.checkedStaff = filteredStaff;
    },
    staffImg(staffName) {
      return `/images/${staffName}.jpg`;
    },
    restart() {
      this.checkedStaff = this.allStaff;
      this.currentStaff = "";
    },
  },
};
</script>

<style>
.grid-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 30vw);
  grid-gap: 15px;
}
.grid-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
</style>
