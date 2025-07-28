<script lang="ts">
	import { appData } from '../../state.svelte';
	import OptionsSelector from '$lib/OptionsSelector.svelte';
	import AreaChartEducationCompare from './DataVizComponents/CompareEducation/AreaChartEducationCompare.svelte';
	import { Drawer, Button, CloseButton } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';

	let hiddenFirst = $state(true);
	let hiddenSecond = $state(true);

	let innerWidth: number = $state();

	let firstOptionsState = $state({
		selectedSexes: [],
		selectedEducation: [],
		selectedSkills: [],
		selectedIslands: [],
		colorsIslands: {
			'French Polynesia': '#0891B2', // Deep Ocean Blue
			Niue: '#0D9488', // Teal
			'New Caledonia': '#059669', // Emerald
			Tonga: '#DC2626', // Coral Red
			'Marshall Islands': '#7C3AED', // Deep Purple
			Vanuatu: '#EA580C', // Sunset Orange
			Nauru: '#CA8A04', // Golden Sand
			Samoa: '#BE185D', // Tropical Pink
			Fiji: '#1D4ED8', // Royal Blue
			'Papua New Guinea': '#16A34A', // Forest Green
			Palau: '#0EA5E9', // Sky Blue
			Micronesia: '#8B5CF6', // Lavender
			Kiribati: '#F59E0B', // Amber
			'Solomon Islands': '#65A30D', // Lime Green
			'Cook Islands': '#EC4899', // Rose Pink
			Tuvalu: '#06B6D4' // Cyan
		}
	});

	let secondOptionsState = $state({
		selectedSexes: [],
		selectedEducation: [],
		selectedSkills: [],
		selectedIslands: [],
		colorsIslands: {
			'French Polynesia': '#0891B2', // Deep Ocean Blue
			Niue: '#0D9488', // Teal
			'New Caledonia': '#059669', // Emerald
			Tonga: '#DC2626', // Coral Red
			'Marshall Islands': '#7C3AED', // Deep Purple
			Vanuatu: '#EA580C', // Sunset Orange
			Nauru: '#CA8A04', // Golden Sand
			Samoa: '#BE185D', // Tropical Pink
			Fiji: '#1D4ED8', // Royal Blue
			'Papua New Guinea': '#16A34A', // Forest Green
			Palau: '#0EA5E9', // Sky Blue
			Micronesia: '#8B5CF6', // Lavender
			Kiribati: '#F59E0B', // Amber
			'Solomon Islands': '#65A30D', // Lime Green
			'Cook Islands': '#EC4899', // Rose Pink
			Tuvalu: '#06B6D4' // Cyan
		}
	});

	const skills = [...new Set(appData.skills.map((skill) => skill['COMPOSITE_BREAKDOWN']))];
	const educationTypes = [...new Set(appData.skills.map((skill) => skill['EDUCATION']))];
	const sexes = [...new Set(appData.skills.map((skill) => skill['SEX']))];

	// Combined filtered data for determining available islands
	const combinedFilteredData = $derived.by(() => {
		return appData.skills.filter((d) => {
			// You can adjust this logic based on whether you want islands to be filtered
			// by either dataset's selections or show all available islands
			return true; // For now, show all islands as options
		});
	});

	const islands = $derived([...new Set(combinedFilteredData.map((d) => d['GEO_PICT']))]);

	// FIRST OPTIONS STATE HANDLERS
	const handleFirstSkillToggle = (skill: string) => {
		const isSelected = firstOptionsState.selectedSkills.includes(skill);

		if (isSelected) {
			firstOptionsState.selectedSkills = firstOptionsState.selectedSkills.filter(
				(s) => s !== skill
			);
		} else {
			firstOptionsState.selectedSkills = [...firstOptionsState.selectedSkills, skill];
		}

		// Clear islands when skills change
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

		// Clear islands when education changes
		firstOptionsState.selectedIslands = [];
	};

	const handleFirstSexToggle = (sex: string) => {
		const isSelected = firstOptionsState.selectedSexes.includes(sex);

		if (isSelected) {
			firstOptionsState.selectedSexes = firstOptionsState.selectedSexes.filter((s) => s !== sex);
		} else {
			firstOptionsState.selectedSexes = [...firstOptionsState.selectedSexes, sex];
		}

		// Clear islands when sex changes
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

	// SECOND OPTIONS STATE HANDLERS
	const handleSecondSkillToggle = (skill: string) => {
		const isSelected = secondOptionsState.selectedSkills.includes(skill);

		if (isSelected) {
			secondOptionsState.selectedSkills = secondOptionsState.selectedSkills.filter(
				(s) => s !== skill
			);
		} else {
			secondOptionsState.selectedSkills = [...secondOptionsState.selectedSkills, skill];
		}

		// Clear islands when skills change
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

		// Clear islands when education changes
		secondOptionsState.selectedIslands = [];
	};

	const handleSecondSexToggle = (sex: string) => {
		const isSelected = secondOptionsState.selectedSexes.includes(sex);

		if (isSelected) {
			secondOptionsState.selectedSexes = secondOptionsState.selectedSexes.filter((s) => s !== sex);
		} else {
			secondOptionsState.selectedSexes = [...secondOptionsState.selectedSexes, sex];
		}

		// Clear islands when sex changes
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
<section class="flex w-full flex-col items-center justify-center gap-5">
	<AreaChartEducationCompare {firstOptionsState} {secondOptionsState} />

	<div class="flex w-full items-center justify-between gap-8 md:flex-row">
		<div class="w-full text-center">
			<Button class="ocean-background w-full rounded-xl " onclick={() => (hiddenFirst = false)}
				>Show Options Database 1</Button
			>
		</div>
		<div class="w-full text-center">
			<Button class="ocean-background w-full rounded-xl" onclick={() => (hiddenSecond = false)}
				>Show Options Database 2</Button
			>
		</div>
	</div>

	<Drawer
		class={innerWidth > 1279 ? 'w-1/4' : 'w-full'}
		placement={innerWidth > 1279 ? 'left' : 'top'}
		bind:hidden={hiddenFirst}
	>
		<div class="flex items-center justify-between">
			<h5
				id="drawer-label"
				class="mb-4 inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400"
			>
				<InfoCircleSolid class="me-2.5 h-5 w-5" />Options Database 1
			</h5>
			<CloseButton onclick={() => (hiddenFirst = true)} class="mb-4 dark:text-white" />
		</div>
		<div class="w-full">
			<OptionsSelector
				optionsState={firstOptionsState}
				onSkillToggle={handleFirstSkillToggle}
				onEducationToggle={handleFirstEducationToggle}
				onSexToggle={handleFirstSexToggle}
				onIslandToggle={handleFirstIslandToggle}
				compare={true}
			/>
		</div>
	</Drawer>
	<Drawer
		class={innerWidth > 1279 ? 'w-1/4' : 'w-full'}
		placement={innerWidth > 1279 ? 'left' : 'top'}
		bind:hidden={hiddenSecond}
	>
		<div class="flex items-center justify-between">
			<h5
				id="drawer-label"
				class="mb-4 inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400"
			>
				<InfoCircleSolid class="me-2.5 h-5 w-5" />Options Database 2
			</h5>
			<CloseButton onclick={() => (hiddenSecond = true)} class="mb-4 dark:text-white" />
		</div>
		<div class="w-full">
			<OptionsSelector
				optionsState={secondOptionsState}
				onSkillToggle={handleSecondSkillToggle}
				onEducationToggle={handleSecondEducationToggle}
				onSexToggle={handleSecondSexToggle}
				onIslandToggle={handleSecondIslandToggle}
				compare={true}
			/>
		</div>
	</Drawer>
</section>
