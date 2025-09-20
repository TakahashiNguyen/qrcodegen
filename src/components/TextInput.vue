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
			<div class="flex justify-center">
				<input
					title=""
					v-model="model"
					class="border--primary bg--0 text--0 h-10 w-full rounded-lg border p-2"
					:class="{
						'ps-10!': icon,
						hidden: type == 'file',
					}"
					:type
					:disabled
					:placeholder
					:multiple
					v-bind="inputAttr"
					:id="inputId"
					:onchange
				/>
				<span
					class="border--primary text--0 h-10 w-full rounded-l-lg border border-r-0 p-2 overflow-hidden"
					v-if="type == 'file'"
				>
					{{ fileName }}
				</span>
				<button
					type="button"
					class="border--primary bg--primary hover:bg--secondary flex h-auto items-center rounded-r-lg border px-4"
					v-if="type == 'file'"
					:onclick="fileSelect"
				>
					Duyệt
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import IconComp from '@/components/Icon.vue';
import { type PropType, computed, ref, useId } from 'vue';

const model = defineModel(),
	inputId = useId(),
	fileName = ref('Chưa có tập tin'),
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
		disabled: { type: Boolean, required: false },
		accept: { type: String, default: '' },
		multiple: { type: Boolean, default: false },
	}),
	inputAttr = computed(() => {
		return { accept: props.accept || undefined };
	}),
	onchange = (event: Event & { target: HTMLInputElement }) => {
		const files = event.target.files;

		if (files && files.length > 0) {
			fileName.value = props.multiple
				? files.length + ' tập tin'
				: files[0].name;
		} else {
			fileName.value = 'No file selected';
		}
	},
	fileSelect = () => {
		document.getElementById(inputId)?.click();
	};
</script>
