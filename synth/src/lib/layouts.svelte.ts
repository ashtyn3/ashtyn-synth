import { ArrowLeft, ArrowRight, ArrowUpFromDot } from "lucide-svelte";
import { addGain, loseGain, gain, ch_param_by } from "$lib/synth.svelte";
import { setText } from "$lib/components/buzzer.svelte";

let PlayLayout = $state([
    // y = 0
    [
        { x: 0.5, y: 0.5 }, // 0
        { x: 23.12, y: 0.5 }, // 1
        { x: 45.74, y: 0.5 }, // 2
        { x: 68.36, y: 0.5, stroke: "#84FF96" }, // 3
        { x: 90.97, y: 0.5, stroke: "#84FF96" }, // 4
        { x: 158.83, y: 0.5, stroke: "black" }, // 5
        { x: 181.45, y: 0.5, stroke: "#84FF96" }, // 6
        { x: 204.07, y: 0.5, stroke: "#84FF96" }, // 7
        { x: 226.68, y: 0.5, stroke: "#84FF96" }, // 8
        { x: 249.3, y: 0.5, stroke: "black" }, // 9
        { x: 271.92, y: 0.5, stroke: "#84FF96" }, // 10
    ],
    // y = 1
    [
        { x: 0.5, y: 22.31 }, // 11
        { x: 23.12, y: 22.31 }, // 12
        { x: 45.74, y: 22.31 }, // 13
        { x: 68.36, y: 22.31, stroke: "#84FF96" }, // 14
        { x: 90.97, y: 22.31, stroke: "#84FF96" }, // 15
        { x: 158.83, y: 22.31, stroke: "#84FF96" }, // 16
        { x: 181.45, y: 22.31, stroke: "#84FF96" }, // 17
        { x: 204.07, y: 22.31, stroke: "#84FF96" }, // 18
        { x: 226.68, y: 22.31, stroke: "#84FF96" }, // 19
        { x: 249.3, y: 22.31, stroke: "#84FF96" }, // 20
        { x: 271.92, y: 22.31, stroke: "#84FF96" }, // 21
    ],
    // y = 2
    [
        null,
        null, // skip to x=45.74
        { x: 45.74, y: 65.12 }, // 22
        { x: 68.36, y: 65.12, inner: ArrowUpFromDot }, // 23
        { x: 90.97, y: 65.12, inner: ArrowLeft }, // 24
        { x: 158.83, y: 65.12, inner: ArrowRight }, // 25
        { x: 181.45, y: 65.12 }, // 26
        { x: 204.07, y: 65.12 }, // 27
        null,
        null,
        null,
    ],
]);

let SequenceLayout = $state([
    // y = 0
    [
        { x: 0.5, y: 0.5 }, // 0
        { x: 23.12, y: 0.5 }, // 1
        { x: 45.74, y: 0.5 }, // 2
        { x: 68.36, y: 0.5 }, // 3
        { x: 90.97, y: 0.5 }, // 4
        { x: 158.83, y: 0.5 }, // 5
        { x: 181.45, y: 0.5 }, // 6
        { x: 204.07, y: 0.5 }, // 7
        { x: 226.68, y: 0.5 }, // 8
        { x: 249.3, y: 0.5 }, // 9
        { x: 271.92, y: 0.5 }, // 10
    ],
    // y = 1
    [
        { x: 0.5, y: 22.31 }, // 11
        { x: 23.12, y: 22.31 }, // 12
        { x: 45.74, y: 22.31 }, // 13
        { x: 68.36, y: 22.31 }, // 14
        { x: 90.97, y: 22.31 }, // 15
        { x: 158.83, y: 22.31 }, // 16
        { x: 181.45, y: 22.31 }, // 17
        { x: 204.07, y: 22.31 }, // 18
        { x: 226.68, y: 22.31 }, // 19
        { x: 249.3, y: 22.31 }, // 20
        { x: 271.92, y: 22.31 }, // 21
    ],
    // y = 2
    [
        null,
        null, // skip to x=45.74
        { x: 45.74, y: 65.12 }, // 22
        { x: 68.36, y: 65.12, inner: ArrowUpFromDot }, // 23
        { x: 90.97, y: 65.12 }, // 24
        { x: 158.83, y: 65.12 }, // 25
        { x: 181.45, y: 65.12 }, // 26
        { x: 204.07, y: 65.12 }, // 27
        null,
        null,
        null,
    ],
]);

export function layout(mode: number) {
    return [PlayLayout, SequenceLayout, SequenceLayout][mode];
}

type Layer = "NORM" | "ADSR";
export const layer = $state({
    current: "NORM",
});

// export function setLayer(l: Layer) {
//     layer = l;
// }
//
// export function getLayer() {
//     return layer;
// }
//
export function logic(states: Array<number>) {
    if (layer.current === "NORM") {
        if (states[23] !== 1) {
            if (states[0] === 1) {
                addGain();
                if (gain() >= 0.25) {
                    setText(`Gain ${(gain() * 100).toFixed(0)}`, "text-yellow-400");
                } else {
                    setText(`Gain ${(gain() * 100).toFixed(0)}`);
                }
            } else if (states[11] === 1) {
                loseGain();
                if (gain() >= 0.25) {
                    setText(`Gain ${(gain() * 100).toFixed(0)}`, "text-yellow-400");
                } else {
                    setText(`Gain ${(gain() * 100).toFixed(0)}`);
                }
            } else if (states[1] === 1) {
                layer.current = "ADSR";
                setText("Envelope modifier");
            }
        }
    } else if (layer.current === "ADSR") {
        if (states[23] === 1) {
            if (states[1] === 1) {
                layer.current = "NORM";
                setText("");
            }
        } else {
            if (states[26] === 1) {
                ADSR_param_logic(states, 0.1);
            } else {
                ADSR_param_logic(states, 0.01);
            }
        }
    }
}

function ADSR_param_logic(states: Array<number>, by: number) {
    if (states[1] === 1) {
        if (states[0] === 1) {
            ch_param_by("env", "attack", by);
        }
        if (states[11] === 1) {
            ch_param_by("env", "attack", -1 * by);
        }
    }
    if (states[2] === 1) {
        if (states[0] === 1) {
            ch_param_by("env", "decay", by);
        }
        if (states[11] === 1) {
            ch_param_by("env", "decay", -1 * by);
        }
    }
    if (states[12] === 1) {
        if (states[0] === 1) {
            ch_param_by("env", "sustain", by);
        }
        if (states[11] === 1) {
            ch_param_by("env", "sustain", -1 * by);
        }
    }
    if (states[13] === 1) {
        if (states[0] === 1) {
            ch_param_by("env", "release", by);
        }
        if (states[11] === 1) {
            ch_param_by("env", "release", -1 * by);
        }
    }
}
