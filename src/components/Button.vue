<template>
	<div class="p-1">
		<button
			title=""
			v-if="type !== 'link'"
			:ref="buttonRef"
			:type
			class="w-full rounded-lg px-5 py-2.5 text-center text-sm font-medium"
			:class="{
				'text--primary bg--primary hover:text--secondary hover:bg--secondary disabled:bg--secondary disabled:text--secondary':
					theme == 'primary',
				'text--tertiary hover:bg--tertiary hover:-text--2':
					theme == 'secondary',
			}"
			:disabled="isLoading"
		>
			<slot v-if="!isLoading" />
			<div
				class="inset-y-0 start-0 flex items-center justify-center-safe"
				v-if="isLoading"
			>
				<Icon name="progress_activity" class="animate-spin" />
			</div>
		</button>
		<a
			class="link"
			v-if="type === 'link'"
			href="#"
			@click="to ? $router.push({ name: to }) : ''"
		>
			<slot />
		</a>
	</div>
</template>

<script setup lang="ts">
import { type PropType, type VNodeRef, ref } from 'vue';

import Icon from './Icon.vue';

const isLoading = ref<boolean>(false);

defineProps({
	type: {
		type: String as PropType<HTMLButtonElement['type'] | 'link'>,
		default: 'button',
	},
	theme: {
		type: String as PropType<'primary' | 'secondary'>,
		default: 'primary',
	},
	buttonRef: {
		type: Function as unknown as PropType<VNodeRef>,
		required: false,
	},
	to: {
		type: String,
		required: false,
	},
});

defineExpose({
	toggleLoading: () => (isLoading.value = !isLoading.value),
});
</script>
