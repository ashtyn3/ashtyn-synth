<script lang="ts" module>
export type Buzzer = {
	type: "none" | "text" | "component";
	text?: string;
	className?: string;
};
let buzzer = $state<Buzzer>({ type: "none" });
let buzzerTimeout: ReturnType<typeof setTimeout> | null = null;

export function setText(t: string, cls?: string) {
	buzzer = { type: "text", text: t, className: cls };
}
</script>

<script lang="ts">
	$effect(() => {
		clearTimeout(buzzerTimeout);
		if (buzzer.type !== 'none') {
			buzzerTimeout = setTimeout(() => {
				buzzer = { type: 'none' };
			}, 800);
		}
	});
</script>

{#if buzzer.type == 'text'}
	<p class={'text-3xl ' + (buzzer.className || '')}>{buzzer.text}</p>
{/if}
