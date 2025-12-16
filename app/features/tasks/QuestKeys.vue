<template>
  <div class="inline-block">
    <div class="text-xs font-medium text-gray-400 mb-2">
      {{ $t('page.tasks.questcard.keysHeader', 'Suggested Keys') }}
      <span class="text-gray-500 font-normal">{{ $t('page.tasks.questcard.keysSubtext', '(may help but not always required)') }}</span>
    </div>
    <div
      v-for="(keyMap, keyMapIndex) in neededKeys"
      :key="keyMapIndex"
      class="mb-2 flex items-center"
    >
      <i18n-t
        keypath="page.tasks.questcard.keysneeded"
        :plural="keyMap.keys.length"
        scope="global"
      >
        <template #keys>
          <span v-for="(key, keyIndex) in keyMap.keys" :key="keyIndex" class="inline-block">
            <GameItem
              :item-id="key.id"
              :item-name="key.shortName"
              :dev-link="key.link"
              :wiki-link="key.wikiLink"
              :count="1"
              size="small"
              class="mr-2"
            />
          </span>
        </template>
        <template #map>
          {{ keyMap.map.name }}
        </template>
      </i18n-t>
    </div>
  </div>
</template>
<script setup>
  defineProps({
    neededKeys: { type: Array, required: true },
  });
</script>
