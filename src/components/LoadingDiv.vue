<template>
	<div class="z-40 h-full w-full" :class="{ hidden: isHidden }">
		<div
			class="bg-dark-0/10 dark:bg-light-0/10 h-full w-full animate-pulse rounded-lg"
		></div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isHidden = ref<Boolean>(false);

function toggleHidden() {
	isHidden.value = !isHidden.value;
}

defineExpose({ toggleHidden });
</script>
