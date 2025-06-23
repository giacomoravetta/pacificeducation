<script lang="ts">
	import { dataState, appState } from '../state.svelte';

	import IslandsSelector from '$lib/IslandsSelector.svelte';
	import LineChartEducation from '$lib/LineChartEducation.svelte';
	import EnabledOptions from '$lib/EnabledOptions.svelte';
	const islands = dataState.skills ? [...new Set(dataState.skills.map((d) => d.GEO_PICT))] : [];
</script>

{#if dataState.skills.length > 0}
	<div
		class="flex h-[1000dvh] w-screen flex-col items-center justify-between overflow-hidden bg-yellow-50"
	>
		<LineChartEducation data={dataState} {appState} />

		{#if appState.optionsIslands.length > 0}
			<EnabledOptions />
		{/if}

		<div class="flex w-screen items-center justify-center">
			<IslandsSelector {islands} {appState} />
		</div>
	</div>
{/if}
