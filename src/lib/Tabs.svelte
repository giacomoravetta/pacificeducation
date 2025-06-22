<!-- Tabs.svelte -->
<script>
	let { tabs = [], activeTab = 0, handleClick } = $props();
	let activeTabIndex = $state(activeTab);
	const setActiveTab = (index) => {
		activeTabIndex = index;
	};
</script>

<div class="tabs-container w-full">
	<!-- Tab Headers -->
	<div class="flex flex-row justify-between">
		<div class="tab-headers flex flex-row gap-2">
			{#each tabs as tab, index}
				<button
					class="tab-header rounded-2xl border border-gray-200 p-4 text-[3dvw] font-medium transition-colors duration-200 {activeTabIndex ===
					index
						? 'bg-blue-50 text-blue-600'
						: 'text-gray-200 hover:bg-blue-400'}"
					onclick={() => setActiveTab(index)}
					role="tab"
					aria-selected={activeTabIndex === index}
					aria-controls="tabpanel-{index}"
					key="tab-{index}"
				>
					{tab.title}
				</button>
			{/each}
		</div>

		<button
			onclick={handleClick}
			class="flex items-center justify-center text-[10dvw]"
			aria-label="close"
		>
			<span class="icon-[material-symbols-light--close-rounded]" style="color: white;"> </span>
		</button>
	</div>

	<!-- Tab Panel -->
	<div class="tab-content mt-4">
		{#each tabs as tab, index}
			{#if activeTabIndex === index}
				<div
					class="tab-panel rounded-lg border border-gray-200 bg-white p-6"
					role="tabpanel"
					id="tabpanel-{index}"
					aria-labelledby="tab-{index}"
				>
					{#if tab.snippet}
						{@render tab.snippet()}
					{:else if tab.content}
						{@html tab.content}
					{:else}
						<p class="text-gray-500">No content available for this tab.</p>
					{/if}
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.tab-panel {
		animation: fadeIn 0.2s ease-in-out;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
