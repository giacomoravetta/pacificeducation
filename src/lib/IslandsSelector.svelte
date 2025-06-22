<script>
	import IslandButton from './IslandButton.svelte';
	import Tabs from './Tabs.svelte';

	let { islands = [], appState } = $props();
	let isClicked = $state(false);

	const handleClick = () => {
		isClicked = !isClicked;
	};
</script>

{#snippet islandsContent()}
	<div class="islands-choices flex h-[60vh] flex-col gap-5 overflow-auto py-4">
		{#each islands as island, index (`${island}-${index}`)}
			<IslandButton idValue={index} {island} {appState}></IslandButton>
		{/each}
	</div>
	<span>
		{appState.optionsIslands.length > 0
			? `Island${appState.optionsIslands.length > 1 ? 's' : ''} selected: ${appState.optionsIslands.map((island) => island.islandName).join(', ')}`
			: 'No island selected'}
	</span>
{/snippet}

{#snippet comparisonContent()}
	<div class="comparison-view p-4">
		<h3 class="mb-3 text-lg font-semibold">Selected Islands Comparison</h3>
		<p class="text-gray-600">Compare selected islands here...</p>
		<div class="mt-4 space-y-2">
			<div class="rounded bg-gray-50 p-3">
				<strong>Feature comparison coming soon...</strong>
			</div>
		</div>
	</div>
{/snippet}

<div
	class="options-table fixed right-0 bottom-0 flex flex-row items-end justify-center transition-transform duration-1000 ease-in-out {isClicked
		? 'translate-x-0'
		: 'translate-x-[100vw]'}"
>
	<button
		aria-label="islands"
		onclick={handleClick}
		class="relative bottom-14 max-h-[20dvh] rounded-l-full bg-blue-500 px-4 py-6 text-xl text-white shadow-lg transition-all hover:shadow-xl"
	>
		🏝️
	</button>
	<div class="h-[100dvh] w-screen bg-blue-500 p-2">
		<div class="h-full overflow-hidden rounded-t-lg">
			<div class="h-full p-4">
				<div class="flex items-center justify-between">
					<Tabs
						tabs={[
							{ title: 'Islands', snippet: islandsContent },
							{ title: 'Comparison', snippet: comparisonContent }
						]}
						activeTab={0}
						{handleClick}
					/>
				</div>
			</div>
		</div>
	</div>
</div>
