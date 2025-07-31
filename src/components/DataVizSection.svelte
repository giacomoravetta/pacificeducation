<script lang="ts">
	import CompareEducationSection from './DataVizSections/CompareEducationSection.svelte';
	import EducationSection from './DataVizSections/EducationSection.svelte';
	import GeoSection from './DataVizSections/GeoSection.svelte';
</script>

<section id="dataviz-section" class="relative flex min-h-screen w-full justify-center pt-10">
	<div class="md: flex w-full flex-col gap-10 rounded-2xl bg-yellow-50 px-4 py-10 md:max-w-5xl">
		<EducationSection />
		<CompareEducationSection />
		<GeoSection />
	</div>
</section>
