<script lang="ts">
	import { appData } from '../state.svelte';

	import Intro from '$lib/Intro.svelte';
	import LineChartEducation from '$lib/LineChartEducation.svelte';
	import CorrelationsChart from '$lib/CorrelationsChart.svelte';
	import BottomDrawer from '$lib/BottomDrawer.svelte';
	import GeneralEducationSection from '$lib/GeneralEducationSection.svelte';
	import CompareEducationSection from '$lib/CompareEducationSection.svelte';
	const islands = appData.skills ? [...new Set(appData.skills.map((d) => d.GEO_PICT))] : [];
</script>

{#if appData.skills != {}}
	<div
		class="flex h-[1000dvh] w-screen flex-col items-center overflow-hidden bg-linear-to-br from-blue-500 via-teal-600 to-emerald-700"
	>
		<Intro />

		<GeneralEducationSection />
		<CompareEducationSection />

		<!-- <CorrelationsChart /> -->
	</div>
{/if}
