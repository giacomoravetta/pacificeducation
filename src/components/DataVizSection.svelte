<!-- Your updated component -->
<script lang="ts">
	import CompareEducationSection from './DataVizSections/CompareEducationSection.svelte';
	import EducationSection from './DataVizSections/EducationSection.svelte';
	import GeoSection from './DataVizSections/GeoSection.svelte';
</script>

<section id="dataviz-section" class="relative flex min-h-screen w-full justify-center">
	<div class=" flex w-full max-w-4xl flex-col gap-10 rounded-2xl bg-yellow-50 px-4 pt-10">
		<EducationSection />
		<CompareEducationSection />
		<GeoSection />
	</div>
</section>
