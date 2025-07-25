<script lang="ts">
	import { appData } from '../state.svelte';

	import Intro from '$lib/Intro.svelte';
	import GeneralEducationSection from '../components/sections/GeneralEducationSection.svelte';
	import CompareEducationSection from '../components/sections/CompareEducationSection.svelte';
</script>

<div
	class="flex h-[1000dvh] w-screen flex-col items-center overflow-hidden bg-linear-to-br from-blue-500 via-teal-600 to-emerald-700"
>
	<Intro />

	<GeneralEducationSection />
	<CompareEducationSection />

	<!-- <CorrelationsChart /> -->
</div>
