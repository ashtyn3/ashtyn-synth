<script lang="ts">
import { layout } from "$lib/layouts.svelte";
let { states = $bindable(), mode } = $props();

const keyPositions = $derived(layout(mode).flat().filter(Boolean));

let keys = $state(new Array(keyPositions.length));

const keyWidth = 17.5794;
const keyHeight = 17.5794;
const rx = 2.5;
</script>

<svg viewBox="0 0 290 84" fill="none" xmlns="http://www.w3.org/2000/svg">
	{#each keyPositions as pos, i}
		<g>
			<rect
				x={pos.x}
				y={pos.y}
				width={keyWidth}
				height={keyHeight}
				{rx}
				stroke={states[i] === 1 ? 'red' : pos.stroke || 'white'}
				bind:this={keys[i]}
			/>
			{#if pos.inner}
				<!-- Example: right arrow SVG, 10x10, centered in the key -->
				<foreignObject
					x={pos.x + keyWidth / 2 - 8}
					y={pos.y + keyHeight / 2 - 8}
					width="16"
					height="16"
					style="pointer-events: none;"
				>
					<pos.inner size={16} />
				</foreignObject>
			{/if}
		</g>
	{/each}
</svg>
