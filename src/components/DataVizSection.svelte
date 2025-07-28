<script lang="ts">
	import CompareEducationSection from './DataVizSections/CompareEducationSection.svelte';
	import EducationSection from './DataVizSections/EducationSection.svelte';
	import GeoSection from './DataVizSections/GeoSection.svelte';
</script>

<section id="dataviz-section" class="flex w-full justify-center bg-yellow-50 pb-10">
	<div class="flex w-full max-w-4xl flex-col gap-10 px-4 pt-10">
		<EducationSection />
		<CompareEducationSection />
		<GeoSection />
	</div>
</section>
