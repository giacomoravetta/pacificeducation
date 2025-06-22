<script lang="ts">
	import { appState } from '../state.svelte';
	let { idValue, island } = $props();

	const isIslandAnOption = (islandName) => {
		return appState.optionsIslands.some((island) => island === islandName);
	};

	const getIslandColor = (islandName) => {
		const color = appState.colorsIslands[islandName];
		return color;
	};

	const handleClick = (e) => {
		const islandName = e.currentTarget.innerText.trim();
		const isSelected = isIslandAnOption(islandName);

		if (isSelected) {
			// Remove the island
			appState.optionsIslands = appState.optionsIslands.filter((island) => island !== islandName);
		} else {
			// Add the island

			appState.optionsIslands = [...appState.optionsIslands, islandName];
		}
		console.log($state.snapshot(appState.optionsIslands));
	};
</script>

<button
	onclick={handleClick}
	id={idValue}
	class="rounded-md px-5 py-2.5 transition-colors duration-200 {isIslandAnOption(island)
		? 'text-white shadow-lg'
		: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
	style={isIslandAnOption(island) ? `background-color: ${getIslandColor(island)}` : ''}
>
	<span class="text-[4vw] font-medium">
		{island}
	</span>
</button>
