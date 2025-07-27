<script lang="ts">
	import CompareEducationSection from './DataVizSections/CompareEducationSection.svelte';
	import EducationSection from './DataVizSections/EducationSection.svelte';
</script>

<section id="dataviz-section" class="w-full">
	<div class="md: flex w-full flex-col bg-yellow-50 p-2 md:p-10">
		<EducationSection />
		<CompareEducationSection />
	</div>
</section>
