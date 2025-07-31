<script lang="ts">
	import Intro from '../components/Intro.svelte';
	import DataVizSection from '../components/DataVizSection.svelte';
	import Description from '../components/Description.svelte';
	import UnderwaterOceanBackground from '../components/UnderwaterOceanBackground.svelte';
</script>

<div class="relative flex w-screen flex-col items-center overflow-hidden">
	<UnderwaterOceanBackground />
	<Intro />
	<Description />
	<DataVizSection />
</div>
