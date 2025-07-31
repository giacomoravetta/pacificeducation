<script lang="ts">
	import Intro from '../components/Intro.svelte';
	import DataVizSection from '../components/DataVizSection.svelte';
	import Description from '../components/Description.svelte';
	import Footer from '../components/Footer.svelte';
	import UnderwaterOceanBackground from '../components/UnderwaterOceanBackground.svelte';
</script>

<UnderwaterOceanBackground />
<div class="relative flex w-full flex-col items-center overflow-hidden pb-10">
	<Intro />
	<Description />
	<DataVizSection />
	<Footer />
</div>
