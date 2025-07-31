<script lang="ts">
	import Intro from '../components/Intro.svelte';
	import DataVizSection from '../components/DataVizSection.svelte';
	import Description from '../components/Description.svelte';
	import UnderwaterOceanBackground from '../components/UnderwaterOceanBackground.svelte';
</script>

<div class="relative flex w-full flex-col items-center overflow-hidden pb-10">
	<UnderwaterOceanBackground />
	<Intro />
	<Description />
	<DataVizSection />
</div>
