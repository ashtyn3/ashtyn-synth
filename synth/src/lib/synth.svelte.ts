import { el, type ElemNode } from "@elemaudio/core";
import { setText } from "$lib/components/buzzer.svelte";
import WebRenderer from "@elemaudio/web-renderer";

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
export let envelope = $state({
    attack: 0.0,
    decay: 0.0,
    sustain: 1,
    release: 0.0,
});

export function ch_param_by(dst: string, p: string, amt: number) {
    if (dst === "env") {
        envelope[p] += amt;
    }
}

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
    voices = new Array<Voice>();

    return node;
}

function computeFrequency(midiNote: number) {
    return 440 * 2 ** ((midiNote - 69) / 12);
}

export function playNote(n: number) {
    const key = `v${n}`;
    const freq = computeFrequency(n);

    // Set gate to 1 (note on)
    voices = voices.filter((v) => v.key !== key).concat({ gate: 1, key, freq });
    return voices;
}

export function stopNote(n: number) {
    const key = `v${n}`;
    // Set gate to 0 (note off), don't remove immediately
    voices = voices.map((v) => (v.key === key ? { ...v, gate: 0 } : v));
    return voices;
}

export function addGain() {
    Gain = Gain + 0.05;
}
export function loseGain() {
    Gain = Gain - 0.05;
}

export function gain() {
    return Gain;
}

export function def() {
    return el.add(
        ...voices.map((v) => {
            const gate = el.const({ key: `${v.key}:gate`, value: v.gate * Gain });
            const frq = el.const({ key: `${v.key}:freq`, value: v.freq });
            const env = el.adsr(
                envelope.attack,
                envelope.decay,
                envelope.sustain,
                envelope.release,
                gate,
            );
            // const s = el.cycle(el.mul(el.phasor(el.div(frq, 2)), frq));
            const s = el.cycle(frq);
            return el.mul(s, env);
        }),
    );
}
export function cow() {
    return el.add(
        ...voices.map((v) => {
            const gate = el.const({ key: `${v.key}:gate`, value: v.gate * Gain });
            const frq = el.const({ key: `${v.key}:freq`, value: v.freq });

            const env = el.adsr(0.09, 0.3, 0.7, 0.7, gate);

            const bendEnv = el.adsr(0.03, 0.9, 0, 0.01, gate); // Fast up, slow down
            // STOMACH 1
            const bendAmt = 20; // Hz to bend down
            const mooPitch = el.add(frq, el.mul(bendEnv, bendAmt));

            // Subtle vibrato on top of pitch bend
            // STOMACH 2
            const lfo = el.cycle(2); // slow, gentle
            const vibratoDepth = 1.3;
            const modFreq = el.add(mooPitch, el.mul(lfo, vibratoDepth));

            const osc = el.add(
                el.mul(el.blepsaw(modFreq), 0.65),
                el.mul(el.triangle(modFreq), 0.45),
            );

            // STOMACH 3
            const formant1 = el.bandpass(20, el.const({ value: 200 }), osc); // main "moo" formant

            // STOMACH 4, 5
            const breath = el.mul(
                el.lowpass(800, el.noise(), el.const({ value: 2000 })),
                0.01,
            );

            const output = el.mul(formant1, breath, env);

            return output;
        }),
    );
}
export function voice() {
    // return def();
    return cow();
}
/*
 * const gate = el.const({ key: `${v.key}:gate`, value: v.gate * Gain });
const frq = el.const({ key: `${v.key}:freq`, value: v.freq });
const env = el.adsr(0.12, 0.3, 0.7, 0.7, gate);

// Wobble LFO for pitch
const lfo = el.cycle(4); // 4 Hz
const vibratoDepth = 8;  // Hz
const modFreq = el.add(frq, el.mul(lfo, vibratoDepth));

// Optional: amplitude wobble
const tremoloLFO = el.cycle(2);
const tremolo = el.add(1, el.mul(tremoloLFO, 0.3));

const s = el.mul(el.blepsaw(modFreq), env, tremolo);

return s;
 */
