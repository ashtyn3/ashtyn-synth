import { el } from "@elemaudio/core";
import WebRenderer from "@elemaudio/web-renderer";
import { onMount } from "svelte";

const Core = $state(new WebRenderer());

export type Voice = {
	key: string;
	freq: number;
	gate: number;
};
export function core() {
	return Core;
}

let voices = $state<Array<Voice>>([]);
let Gain = 0.1;

export async function init() {
	const Audio = window.AudioContext;
	const ctx = new Audio();
	const node = await Core.initialize(ctx, {
		numberOfInputs: 0,
		numberOfOutputs: 1,
		outputChannelCount: [2],
	});

	node.connect(ctx.destination);
	voices = new Array<Voice>(6);

	return node;
}

function computeFrequency(midiNote: number) {
	return 440 * 2 ** ((midiNote - 69) / 12);
}

export function playNote(n: number) {
	const key = `v${n}`;
	const freq = computeFrequency(n);

	voices = voices.filter((v) => v.key !== key).concat({ gate: 0, key, freq });
	return voices;
}

export function stopNote(n: number) {
	const key = `v${n}`;
	voices = voices.filter((v) => v.key !== key);
	return voices;
}

export function addGain() {
	Gain = Gain + 0.05;
}
export function loseGain() {
	Gain = Gain - 0.05;
	console.log(Gain);
}

export function gain() {
	return Gain;
}

export function voice() {
	if (voices.length < 1) {
		return none();
	}
	return el.mul(el.add(...voices.map((v) => el.cycle(v.freq))), Gain);
}

function none() {
	return el.const({ value: 0 });
}
