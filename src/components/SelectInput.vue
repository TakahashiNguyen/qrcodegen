<template>
	<div class="text--primary bg--0 flex w-full flex-col p-1">
		<label class="bg--0 z-1 -mb-2 ml-2 block w-fit text-sm font-medium">
			{{ name }}
		</label>
		<select
			class="border--primary bg--0 text--0 w-full rounded-lg border p-2.5"
			v-model="model"
		>
			<option v-for="i in list" v-bind:key="i[0]" :value="i[1]">
				{{ i[0].replace('_', ' ') }}
			</option>
		</select>
	</div>
</template>

<script setup lang="ts">
const model = defineModel();

defineProps<{
	name: string;
	list: Map<string, string>;
}>();
</script>