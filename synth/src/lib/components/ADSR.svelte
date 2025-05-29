<script lang="ts">
import * as d3 from "d3";
import { envelope } from "$lib/synth.svelte";
//
// export let A = 0.1;
// export let D = 0.2;
// export let S = 0.6;
// export let R = 0.2;
const sustainDuration = 0.4;
let { attack: A, decay: D, sustain: S, release: R } = $derived(envelope);
$effect(() => {
	console.log(A);
});

let svgEl;

const totalDuration = $derived(A + D + sustainDuration + R);
const sampleRate = 1000;
$effect(() => {
	const envelopeData = generateEnvelope();
	drawEnvelope(svgEl, envelopeData);
});

function exponentialRise(t, duration) {
	const tau = duration / 5;
	return 1 - Math.exp(-t / tau);
}

function exponentialFall(t, duration, start, end) {
	const tau = duration / 5;
	return end + (start - end) * Math.exp(-t / tau);
}

function generateEnvelope() {
	const env = [];
	for (let i = 0; i < totalDuration * sampleRate; i++) {
		const t = i / sampleRate;
		let amp = 0;

		if (t < A) {
			amp = exponentialRise(t, A);
		} else if (t < A + D) {
			amp = exponentialFall(t - A, D, 1, S);
		} else if (t < A + D + sustainDuration) {
			amp = S;
		} else if (t < A + D + sustainDuration + R) {
			amp = exponentialFall(t - A - D - sustainDuration, R, S, 0);
		} else {
			amp = 0;
		}

		env.push({ time: t, amplitude: amp });
	}
	return env;
}

function drawEnvelope(svgEl, data) {
	if (!svgEl) return;

	const width = 700;
	const height = 300;

	d3.select(svgEl).selectAll("*").remove();

	const svg = d3
		.select(svgEl)
		.attr("viewBox", `0 0 ${width} ${height}`)
		.attr("preserveAspectRatio", "xMidYMid meet");

	const xScale = d3
		.scaleLinear()
		.domain([0, totalDuration])
		.range([50, width - 20]);

	const yScale = d3
		.scaleLinear()
		.domain([0, 1])
		.range([height - 50, 20]);

	const line = d3
		.line()
		.x((d) => xScale(d.time))
		.y((d) => yScale(d.amplitude))
		.curve(d3.curveBumpY);

	svg
		.append("path")
		.datum(data)
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-width", 2)
		.attr("d", line);

	const xAxis = d3.axisBottom(xScale).ticks(0);
	const yAxis = d3.axisLeft(yScale).ticks(0);

	svg
		.append("g")
		.attr("transform", `translate(0,${height - 50})`)
		.call(xAxis);
	svg.append("g").attr("transform", "translate(50,0)").call(yAxis);
}
</script>

<svg bind:this={svgEl}></svg>
