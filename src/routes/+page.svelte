<script lang="ts">
	import { dataState, appState } from '../state.svelte';

	import IslandsSelector from '$lib/IslandsSelector.svelte';
	import LineChartEducation from '$lib/LineChartEducation.svelte';

	const data = $state.snapshot(dataState);

	const islands = [...new Set(data.map((d) => d.GEO_PICT))];
</script>

<svelte:window
	onresize={() => {
		console.log('ciao');
	}}
/>

<div class="flex h-screen w-screen flex-col items-center justify-center bg-yellow-50">
	<LineChartEducation {data} {appState} />

	<div class="flex w-screen items-center justify-center">
		<IslandsSelector {islands} {appState} />
	</div>
</div>
