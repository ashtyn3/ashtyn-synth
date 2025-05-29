<script lang="ts">
import * as d3 from "d3";
import { core } from "$lib/synth.svelte";
import { onDestroy } from "svelte";

let svgEl: SVGSVGElement;

const width = 600;
const height = 200;

const svg = () =>
	d3
		.select(svgEl)
		.attr("viewBox", `0 0 ${width} ${height}`)
		.attr("preserveAspectRatio", "xMidYMid meet");

const drawWaveform = (data: number[]) => {
	setTimeout(() => {}, 800);
	// Clear previous content
	svg().selectAll("*").remove();

	// X scale: index of data
	const x = d3
		.scaleLinear()
		.domain([0, data.length - 1])
		.range([20, width - 20]);

	// Y scale: value of data
	const y = d3
		.scaleLinear()
		.domain([d3.min(data) ?? 0, d3.max(data) ?? 1])
		.range([height - 50, 20]);

	// Line generator
	const line = d3
		.line<number>()
		.x((_, i) => x(i))
		.y((d) => {
			return y(d);
		});

	// Draw the waveform
	svg()
		.append("path")
		.datum(data)
		.attr("d", line)
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-width", 2);
};

const unsub = core().on("scope", (scope) => {
	const cleanData = scope.data.flatMap((arr) => Array.from(arr));

	drawWaveform(cleanData);
});
</script>

<svg class="w-full" bind:this={svgEl} />
