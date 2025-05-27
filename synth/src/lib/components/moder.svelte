<script lang="ts">
let { mode = $bindable() } = $props();
</script>

<div class="flex h-fit w-fit justify-evenly border-1 border-white">
	<div class={`${mode === 0 ? 'bg-red-500' : ''} p-1`}>play</div>
	<div class={`${mode === 1 ? 'bg-red-500' : ''} p-1`}>sequence</div>
	<div class={`${mode === 2 ? 'bg-red-500' : ''} p-1`}>sample</div>
</div>
