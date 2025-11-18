/* eslint-disable import/no-mutable-exports */
import { PiniaFireswap } from "./pinia-firestore";
import type { Pinia } from "pinia";

export let pinia: Pinia | undefined;

export function installPiniaPlugins(target: Pinia): void {
  target.use(PiniaFireswap);
}

export default defineNuxtPlugin((nuxtApp) => {
  // Get pinia instance from @pinia/nuxt module
  pinia = nuxtApp.$pinia as Pinia | undefined;
  if (pinia) {
    installPiniaPlugins(pinia);
  }
  // Don't provide $pinia again - it's already provided by @pinia/nuxt
});
