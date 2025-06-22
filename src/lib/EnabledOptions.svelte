<script lang="ts">
	import { appState } from '../state.svelte';

	const isIslandSelected = (islandName) => {
		return appState.selectedIslands.includes(islandName);
	};

	const handleClick = (e) => {
		const islandName = e.currentTarget.innerText.trim();
		const isSelected = isIslandSelected(islandName);

		if (isSelected) {
			appState.selectedIslands = appState.selectedIslands.filter((island) => island !== islandName);
		} else {
			// Add the island

			appState.selectedIslands = [...appState.selectedIslands, islandName];
		}
		console.log('Selected: ' + $state.snapshot(appState.selectedIslands));
	};
</script>

<div class="flex flex-row flex-wrap items-center gap-3">
	{#if appState.optionsIslands}
		{#each appState.optionsIslands.map((island) => island) as island}
			<div
				class="flex flex-row items-center justify-center gap-3 rounded-2xl border p-2 text-gray-700"
				style="border-color: {appState.selectedIslands.includes(island)
					? appState.colorsIslands[island] + '33'
					: '#c9c9c933'}; background-color: {appState.selectedIslands.includes(island)
					? appState.colorsIslands[island] + '33'
					: '#c9c9c933'}"
			>
				<button onclick={handleClick}>{island}</button>
			</div>
		{/each}
	{/if}
</div>
