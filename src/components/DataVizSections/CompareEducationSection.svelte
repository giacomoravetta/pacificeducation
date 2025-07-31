<script lang="ts">
	import { appData } from '../../state.svelte';
	import OptionsSelector from '$lib/OptionsSelector.svelte';
	import AreaChartEducationCompare from './DataVizComponents/CompareEducation/AreaChartEducationCompare.svelte';
	import { Drawer, Button } from 'flowbite-svelte';

	let hiddenFirst = $state(true);
	let hiddenSecond = $state(true);

	let innerWidth: number = $state();

	let firstOptionsState = $state({
		selectedSexes: [],
		selectedEducation: [],
		selectedSkills: [],
		selectedIslands: [],
		colorsIslands: {}
	});

	let secondOptionsState = $state({
		selectedSexes: [],
		selectedEducation: [],
		selectedSkills: [],
		selectedIslands: [],
		colorsIslands: {}
	});

	const skills = [...new Set(appData.skills.map((skill) => skill['COMPOSITE_BREAKDOWN']))];
	const educationTypes = [...new Set(appData.skills.map((skill) => skill['EDUCATION']))];
	const sexes = [...new Set(appData.skills.map((skill) => skill['SEX']))];

	const combinedFilteredData = $derived.by(() => {
		return appData.skills.filter((d) => {});
	});

	const islands = $derived([...new Set(combinedFilteredData.map((d) => d['GEO_PICT']))]);

	const firstDatasetStats = $derived.by(() => {
		if (!firstOptionsState.selectedIslands.length || !firstOptionsState.selectedSkills.length) {
			return { count: 0, avgValue: 0, islands: 0 };
		}

		const filteredData = appData.skills.filter(
			(d) =>
				firstOptionsState.selectedIslands.includes(d.GEO_PICT) &&
				firstOptionsState.selectedSkills.includes(d.COMPOSITE_BREAKDOWN) &&
				(firstOptionsState.selectedSexes.length === 0 ||
					firstOptionsState.selectedSexes.includes(d.SEX)) &&
				(firstOptionsState.selectedEducation.length === 0 ||
					firstOptionsState.selectedEducation.includes(d.EDUCATION))
		);

		const avgValue =
			filteredData.length > 0
				? filteredData.reduce((sum, d) => sum + +d.OBS_VALUE, 0) / filteredData.length
				: 0;

		return {
			count: filteredData.length,
			avgValue: avgValue.toFixed(1),
			islands: firstOptionsState.selectedIslands.length
		};
	});

	const secondDatasetStats = $derived.by(() => {
		if (!secondOptionsState.selectedIslands.length || !secondOptionsState.selectedSkills.length) {
			return { count: 0, avgValue: 0, islands: 0 };
		}

		const filteredData = appData.skills.filter(
			(d) =>
				secondOptionsState.selectedIslands.includes(d.GEO_PICT) &&
				secondOptionsState.selectedSkills.includes(d.COMPOSITE_BREAKDOWN) &&
				(secondOptionsState.selectedSexes.length === 0 ||
					secondOptionsState.selectedSexes.includes(d.SEX)) &&
				(secondOptionsState.selectedEducation.length === 0 ||
					secondOptionsState.selectedEducation.includes(d.EDUCATION))
		);

		const avgValue =
			filteredData.length > 0
				? filteredData.reduce((sum, d) => sum + +d.OBS_VALUE, 0) / filteredData.length
				: 0;

		return {
			count: filteredData.length,
			avgValue: avgValue.toFixed(1),
			islands: secondOptionsState.selectedIslands.length
		};
	});

	const handleFirstSkillToggle = (skill: string) => {
		const isSelected = firstOptionsState.selectedSkills.includes(skill);

		if (isSelected) {
			firstOptionsState.selectedSkills = firstOptionsState.selectedSkills.filter(
				(s) => s !== skill
			);
		} else {
			firstOptionsState.selectedSkills = [...firstOptionsState.selectedSkills, skill];
		}

		firstOptionsState.selectedIslands = [];
	};

	const handleFirstEducationToggle = (education: string) => {
		const isSelected = firstOptionsState.selectedEducation.includes(education);

		if (isSelected) {
			firstOptionsState.selectedEducation = firstOptionsState.selectedEducation.filter(
				(e) => e !== education
			);
		} else {
			firstOptionsState.selectedEducation = [...firstOptionsState.selectedEducation, education];
		}

		firstOptionsState.selectedIslands = [];
	};

	const handleFirstSexToggle = (sex: string) => {
		const isSelected = firstOptionsState.selectedSexes.includes(sex);

		if (isSelected) {
			firstOptionsState.selectedSexes = firstOptionsState.selectedSexes.filter((s) => s !== sex);
		} else {
			firstOptionsState.selectedSexes = [...firstOptionsState.selectedSexes, sex];
		}

		firstOptionsState.selectedIslands = [];
	};

	const handleFirstIslandToggle = (island: string) => {
		const isSelected = firstOptionsState.selectedIslands.includes(island);

		if (isSelected) {
			firstOptionsState.selectedIslands = firstOptionsState.selectedIslands.filter(
				(i) => i !== island
			);
		} else {
			firstOptionsState.selectedIslands = [...firstOptionsState.selectedIslands, island];
		}
	};

	const handleSecondSkillToggle = (skill: string) => {
		const isSelected = secondOptionsState.selectedSkills.includes(skill);

		if (isSelected) {
			secondOptionsState.selectedSkills = secondOptionsState.selectedSkills.filter(
				(s) => s !== skill
			);
		} else {
			secondOptionsState.selectedSkills = [...secondOptionsState.selectedSkills, skill];
		}

		secondOptionsState.selectedIslands = [];
	};

	const handleSecondEducationToggle = (education: string) => {
		const isSelected = secondOptionsState.selectedEducation.includes(education);

		if (isSelected) {
			secondOptionsState.selectedEducation = secondOptionsState.selectedEducation.filter(
				(e) => e !== education
			);
		} else {
			secondOptionsState.selectedEducation = [...secondOptionsState.selectedEducation, education];
		}

		secondOptionsState.selectedIslands = [];
	};

	const handleSecondSexToggle = (sex: string) => {
		const isSelected = secondOptionsState.selectedSexes.includes(sex);

		if (isSelected) {
			secondOptionsState.selectedSexes = secondOptionsState.selectedSexes.filter((s) => s !== sex);
		} else {
			secondOptionsState.selectedSexes = [...secondOptionsState.selectedSexes, sex];
		}

		secondOptionsState.selectedIslands = [];
	};

	const handleSecondIslandToggle = (island: string) => {
		const isSelected = secondOptionsState.selectedIslands.includes(island);

		if (isSelected) {
			secondOptionsState.selectedIslands = secondOptionsState.selectedIslands.filter(
				(i) => i !== island
			);
		} else {
			secondOptionsState.selectedIslands = [...secondOptionsState.selectedIslands, island];
		}
	};
</script>

<svelte:window bind:innerWidth />

<section class="flex w-full flex-col items-center justify-center gap-8 p-6">
	<div class="w-full max-w-6xl text-center">
		<div
			class="mb-6 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-3 text-sm font-medium text-cyan-700 ring-1 ring-cyan-200/50"
		>
			<svg class="size-5" fill="currentColor" viewBox="0 0 20 20">
				<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span>Comparative Analysis</span>
		</div>

		<h1
			class="mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-4xl font-bold text-transparent lg:text-5xl"
		>
			Education Data Comparison
		</h1>

		<p class="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 lg:text-xl">
			Compare education metrics across different Pacific Island nations, demographic groups, and
			skill categories to identify trends and disparities.
		</p>
	</div>

	<div class="flex w-full max-w-6xl flex-col gap-2">
		<div class="w-full max-w-7xl">
			<AreaChartEducationCompare {firstOptionsState} {secondOptionsState} />
		</div>

		<div class="w-full">
			<div class="flex w-full flex-col gap-2 md:flex-row">
				<div class="group w-full">
					<div
						class="rounded-2xl border border-blue-200/50 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/50"
					>
						<div class="mb-4 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div
									class="flex size-8 items-center justify-center rounded-full bg-blue-500 text-white"
								>
									<span class="text-sm font-bold">A</span>
								</div>
								<h4 class="font-semibold text-blue-900">Primary Dataset</h4>
							</div>
							{#if firstDatasetStats.count > 0}
								<div class="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
									{firstDatasetStats.count} points
								</div>
							{/if}
						</div>

						<Button
							class="group w-full transform rounded-xl border-0 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-200/50 focus:ring-4 focus:ring-blue-200 focus:outline-none"
							onclick={() => (hiddenFirst = false)}
						>
							<div class="flex items-center justify-center gap-2">
								<svg
									class="size-5 transition-transform group-hover:scale-110"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
									/>
								</svg>
								<span>Configure Dataset A</span>
							</div>
						</Button>

						{#if firstOptionsState.selectedIslands.length === 0}
							<div class="mt-3 flex items-center gap-2 text-sm text-amber-600">
								<svg class="size-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								<span>No data selected</span>
							</div>
						{/if}
					</div>
				</div>

				<div class="group w-full">
					<div
						class="rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-white to-emerald-50/30 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/50"
					>
						<div class="mb-4 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div
									class="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white"
								>
									<span class="text-sm font-bold">B</span>
								</div>
								<h4 class="font-semibold text-emerald-900">Secondary Dataset</h4>
							</div>
							{#if secondDatasetStats.count > 0}
								<div
									class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
								>
									{secondDatasetStats.count} points
								</div>
							{/if}
						</div>

						<Button
							class="group w-full transform rounded-xl border-0 bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-200/50 focus:ring-4 focus:ring-emerald-200 focus:outline-none"
							onclick={() => (hiddenSecond = false)}
						>
							<div class="flex items-center justify-center gap-2">
								<svg
									class="size-5 transition-transform group-hover:scale-110"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
									/>
								</svg>
								<span>Configure Dataset B</span>
							</div>
						</Button>

						{#if secondOptionsState.selectedIslands.length === 0}
							<div class="mt-3 flex items-center gap-2 text-sm text-amber-600">
								<svg class="size-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								<span>No data selected</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<Drawer
			class="flex h-full w-full items-center justify-center bg-transparent p-0"
			placement={innerWidth > 1279 ? 'left' : 'top'}
			bind:hidden={hiddenFirst}
		>
			<OptionsSelector
				optionsState={firstOptionsState}
				onSkillToggle={handleFirstSkillToggle}
				onEducationToggle={handleFirstEducationToggle}
				onSexToggle={handleFirstSexToggle}
				onIslandToggle={handleFirstIslandToggle}
				compare={true}
				bind:hidden={hiddenFirst}
			/>
		</Drawer>

		<Drawer
			class="flex h-full w-full items-center justify-center bg-transparent p-0"
			placement={innerWidth > 1279 ? 'left' : 'top'}
			bind:hidden={hiddenSecond}
		>
			<OptionsSelector
				optionsState={secondOptionsState}
				onSkillToggle={handleSecondSkillToggle}
				onEducationToggle={handleSecondEducationToggle}
				onSexToggle={handleSecondSexToggle}
				onIslandToggle={handleSecondIslandToggle}
				compare={true}
				bind:hidden={hiddenSecond}
			/>
		</Drawer>
	</div>
</section>
