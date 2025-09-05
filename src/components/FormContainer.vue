<template>
	<div class="center h-dvh">
		<div
			class="bg--0 tablet:w-lg desktop:w-4xl desktop:min-h-auto tablet:min-h-auto min-h-dvh h-fit w-dvw rounded-lg p-8 items-center flex"
		>
			<form
				class="justify-center-safe desktop:flex-row desktop:justify-between flex size-full flex-col space-y-6"
				@submit.prevent="buttonHandler"
			>
				<h5 class="text-3xl font-medium" v-if="title">
					{{ title }}
				</h5>
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