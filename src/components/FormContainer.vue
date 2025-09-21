<template>
	<div class="center h-dvh">
		<div
			class="bg--0 tablet:w-lg desktop:w-4xl desktop:min-h-auto tablet:min-h-auto flex h-fit min-h-dvh w-dvw items-center rounded-lg p-8"
		>
			<form
				class="desktop:flex-row desktop:justify-between flex size-full flex-col justify-center-safe space-y-6"
				@submit.prevent="buttonHandler"
			>
				<a class="text-3xl font-medium" v-if="title">
					{{ title }}
				</a>
				<div class="desktop:w-md w-full space-y-6">
					<slot />
				</div>
			</form>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	title?: string;
	buttonHandler: () => void;
}>();
</script>
