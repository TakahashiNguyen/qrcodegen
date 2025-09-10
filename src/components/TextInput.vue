<template>
	<div class="text--primary bg--0 flex w-full flex-col p-1">
		<label class="bg--0 z-1 -mb-2 ml-2 block w-fit text-sm font-medium">
			{{ name }}
		</label>
		<div class="relative z-0">
			<div
				v-if="icon"
				class="pointer-events-none absolute inset-y-0 start-0 flex items-center px-[9px]"
			>
				<IconComp :name="icon.toLowerCase()"></IconComp>
			</div>
			<input
				title=""
				v-model="model"
				class="border--primary bg--0 text--0 w-full rounded-lg border p-2.5"
				:class="{
					'ps-10!': icon,
				}"
				:type="type"
				:disabled="disable"
				:placeholder="placeholder"
				v-bind="inputAttr"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import IconComp from '@/components/Icon.vue';
import { type PropType, computed } from 'vue';

const model = defineModel(),
	props = defineProps({
		name: {
			type: String,
			required: true,
		},
		type: {
			type: String as PropType<HTMLInputElement['type']>,
			default: 'text',
		},
		icon: { type: String, required: false },
		placeholder: { type: String, required: false },
		disable: { type: Boolean, required: false },
		accept: { type: String, default: '' },
	}),
	inputAttr = computed(() => {
		return { accept: props.accept || undefined };
	});
</script>
