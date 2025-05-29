<script lang="ts">
import Buzzer, { setText } from "$lib/components/buzzer.svelte";
import { el, type ElemNode } from "@elemaudio/core";
import Keeb from "$lib/components/keeb.svelte";
import Moder from "$lib/components/moder.svelte";
import Story from "$lib/components/story.svelte";
import { logic } from "$lib/layouts.svelte";
import { init, core, voice, stopNote, playNote } from "$lib/synth.svelte";
import { onMount } from "svelte";
import { WebMidi } from "webmidi";

let device = $state<HIDDevice | null>(null);
let mode = $state(0);
let PITCH_MOD = $state(5);
let node = $state<AudioWorkletNode | null>();
let key_states = $state(new Array(28).fill(0));

function handleInReport(event: HIDInputReportEvent) {
	const { data } = event;
	const buffer = new Uint8Array(data.buffer);
	mode = buffer[0];
	PITCH_MOD = buffer[1];
	const keystates = buffer.subarray(2, 35);
	const bottom_row = keystates.slice(24, 30);
	key_states = [...keystates.slice(0, 22), ...bottom_row];
	logic(key_states);
}
</script>

<div class="flex h-screen w-full items-center justify-center">
	<div class="m-5 flex h-full w-full items-center justify-center gap-2 text-white">
		<div class="flex h-[90%] w-[80%] flex-col gap-6 rounded-xl bg-black p-5">
			<div class="col-span-5 flex w-full flex-row items-center justify-between">
				<!-- Top row: Moder, Connected, Connect button -->
				<div>
					<Moder {mode} />
				</div>
				<div>
					<div hidden={device == null}>
						{(device || { productName: 'none' }).productName}
					</div>
					<button
						class="h-fit border-1 p-3 hover:cursor-pointer"
						hidden={device != null}
						onclick={async () => {
							const devices = await navigator.hid.requestDevice({
								filters: [
									{
										vendorId: 0x2e8a,
										productId: 0x0005
									}
								]
							});
							device = devices[0];
							if (device) {
								await device.open();
								device.oninputreport = handleInReport;

								const midi = await WebMidi.enable();
								const midi_dev = midi.getInputById('1131009229');
								midi_dev.addListener('noteon', async (d) => {
									const note_string = d.note.name + (d.note.accidental || '') + (PITCH_MOD - 1);
									setText(note_string);
									const v = await playNote(d.note.number);
									core().render(el.scope({}, voice()), voice());
								});
								midi_dev.addListener('noteoff', async (d) => {
									stopNote(d.note.number);
									core().render(voice(), voice());
								});
								navigator.mediaDevices.getUserMedia({ audio: true });
								node = await init();
							}
						}}
					>
						Connect
					</button>
				</div>
			</div>
			<div class="flex flex-row items-center justify-between">
				<!-- Second row: Buzzer -->
				<div class="w-1/2">
					<Buzzer />
				</div>
				<div class="w-1/2">
					<Keeb states={key_states} {mode} />
				</div>
			</div>
			<div class="flex flex-row items-center justify-between">
				<!-- Second row: Buzzer -->
				<div class="w-full">
					<Story {mode} />
					<!-- <Story A={0.1} D={0.2} S={0.3} R={0.4} /> -->
				</div>
			</div>
		</div>
	</div>
</div>
