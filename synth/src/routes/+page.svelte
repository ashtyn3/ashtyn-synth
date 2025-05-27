<script lang="ts">
import Keeb from "$lib/components/keeb.svelte";
import Moder from "$lib/components/moder.svelte";
import { WebMidi } from "webmidi";

let device = $state(null);
let mode = $state(0);
let PITCH_MOD = $state(5);
let key_states = $state(new Array(28).fill(0));

function handleInReport(event) {
	const { data } = event;
	const buffer = new Uint8Array(data.buffer);
	mode = buffer[0];
	PITCH_MOD = buffer[1];
	const keystates = buffer.subarray(2, 35);
	const bottom_row = keystates.slice(24, 30);
	key_states = [...keystates.slice(0, 22), ...bottom_row];
}
</script>

<div class="flex h-screen items-center justify-center">
	<div class="h-[80%] w-[70%] bg-[#D9D9D9]">
		<div class="m-5 flex h-full justify-center text-white">
			<div
				class="grid h-[25%] w-[80%] grid-cols-3 grid-rows-2 rounded-xl bg-black p-5 align-middle"
			>
				<div hidden={device == null} class="col-start-3 col-end-3 flex justify-end text-sm">
					Connected: {(device || { productName: 'none' }).productName}
				</div>

				<div class="col-start-3 col-end-3 flex justify-end">
					<div
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
							await device.open();
							device.oninputreport = handleInReport;

							const midi = await WebMidi.enable();
							const midi_dev = midi.getInputById('1131009229');
							midi_dev.addListener('noteon', (d) => {
								console.log(d.note.name + (d.note.accidental || '') + PITCH_MOD);
							});
						}}
					>
						Connect
					</div>
				</div>
				<div class="col-start-1 col-end-1 row-start-1 row-end-1">
					<Moder {mode} />
				</div>
				<div class="col-start-3 col-end-3">
					<div>
						<Keeb states={key_states} {mode} />
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
