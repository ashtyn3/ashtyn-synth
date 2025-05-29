<script lang="ts" module>
import type { Component } from "svelte";
import Adsr from "./ADSR.svelte";

export type StoryType = "NORM" | "ADSR";
export type Story = {
	Comp?: Component;
};
</script>

<script lang="ts">
	import { layer } from '$lib/layouts.svelte';
	import Scopey from './scopey.svelte';
	let { mode = $bindable() } = $props();
	$effect(() => {
		console.log(mode);
	});
	let modes: Array<{ [key in StoryType]: Story }> = [
		{
			NORM: {
				Comp: Scopey
			},
			ADSR: {
				Comp: Adsr
			}
		}
	];
	let select = $derived(layer);
	let comp = $derived(
		(() => {
			if (modes[mode]) {
				return modes[mode][select.current];
			}
			return { Comp: null };
		})()
	);
	// let buzzer = $state<StoryType>('NORM');
</script>

<div class="w-full">
	{#if comp.Comp}
		<comp.Comp />
	{:else}{/if}
</div>
