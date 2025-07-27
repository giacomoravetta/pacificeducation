<script lang="ts">
	import CompareEducationSection from './DataVizSections/CompareEducationSection.svelte';
	import EducationSection from './DataVizSections/EducationSection.svelte';
</script>

<section id="dataviz-section" class="w-full">
	<div class="flex w-full flex-col gap-10 bg-yellow-50 px-4 pt-10 md:px-40">
		<EducationSection />
		<CompareEducationSection />
	</div>
</section>
