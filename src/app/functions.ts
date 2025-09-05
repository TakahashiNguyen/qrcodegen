import { type Ref, type VNodeRef } from 'vue';

/**
 * Create value passthrough from slot.
 *
 * @example
 *
 * ```ts
 * const foo = getSlotRefSet(input);
 * ```
 *
 * @template T
 * @param {Ref<T>} input - Ref input.
 */
export function getSlotRefSet<T>(input: Ref<T>): VNodeRef {
	// @ts-expect-error error-free expression
	return (i: T) => {
		input.value = i;
	};
}

/**
 * Function wait page fully loaded.
 *
 * @example
 *
 * ```ts
 * await waitForPageLoad();
 * ```
 */
export function waitForPageLoad(): Promise<void> {
	return new Promise((resolve) => {
		if (document.readyState === 'complete') {
			resolve();
		} else {
			window.addEventListener('load', () => resolve(), { once: true });
		}
	});
}

/**
 * Sleep function.
 *
 * @example
 *
 * ```ts
 * sleep(1000); // sleep for a second.
 * ```
 *
 * @param {number} ms - Milliseconds of sleep.
 * @returns {Promise<void>} Sleep async for await.
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
