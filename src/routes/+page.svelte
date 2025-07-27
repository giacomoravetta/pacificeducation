<script lang="ts">
	import { appData } from '../state.svelte';

	import Intro from '../components/Intro.svelte';
	import DataVizSection from '../components/DataVizSection.svelte';
</script>

<div class="flex w-screen flex-col items-center overflow-hidden">
	<Intro />
	<DataVizSection />

	<!-- <CorrelationsChart /> -->
</div>
