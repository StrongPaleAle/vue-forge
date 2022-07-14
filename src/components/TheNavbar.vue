<script setup lang="ts">

import { Button as KButton } from '@progress/kendo-vue-buttons';
import { Popup as KPopup } from '@progress/kendo-vue-popup';

import { computed, ref } from 'vue';

const showTeams = ref(false);
const team = [
  {
    name: "StrongAle",
    url: "https://github.com/StrongPaleAle",
  },
  {
    name: "SPH73",
    url: "https://github.com/SPH73",
  },
  {
    name: "geekmaros",
    url: "https://github.com/geekmaros",
  },
];
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}
const shuffleTeam = computed(() => shuffleArray(team));

</script>

<template>

<div
    class="p-4 border-bottom border-2 flex justify-between"
    style="margin: -1px"
  >
    <img
      src="https://vuejsforge.com/images/logo.svg"
      width="150"
      class="max-w-none"
      alt="Vue.js Forge"
    />
    <div>
      <button
        ref="button"
        class="mr-5 text-[#ff6358]"
        @click="showTeams = !showTeams"
      >
        <span class="k-icon k-i-ungroup"></span>
        Yellow Eland
      </button>
    
      <KPopup :anchor="'button'" :show="showTeams" class="mt-5">
        <ul>
          <li v-for="person in shuffleTeam" :key="person.name" class="px-5 py-2" @click="showTeams = false">
            <a href="{{ person.url }}" target="_blank">{{ person.name }}</a>
          </li>
        
        </ul>
      </KPopup>

      <KButton :rounded = "'full'" :shape = "'rectangle'" :icon = "'logout'" :theme-color="'warning'">Logout</KButton>
    </div>
  </div>

</template>