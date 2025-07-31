<script lang="ts">
	import LineChartEducation from './DataVizComponents/Education/LineChartEducation.svelte';
	import OptionsSelector from '$lib/OptionsSelector.svelte';
	import { appData } from '../../state.svelte';

	import { Drawer, Button, CloseButton } from 'flowbite-svelte';

	let innerWidth = $state();

	let hidden = $state(true);

	let optionsState = $state({
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

	const handleSkillToggle = (skill: string) => {
		const isSelected = optionsState.selectedSkills.includes(skill);

		if (isSelected) {
			optionsState.selectedSkills = optionsState.selectedSkills.filter((s) => s !== skill);
		} else {
			optionsState.selectedSkills = [...optionsState.selectedSkills, skill];
		}

		optionsState.selectedIslands = [];
	};

	const handleEducationToggle = (education: string) => {
		const isSelected = optionsState.selectedEducation.includes(education);

		if (isSelected) {
			optionsState.selectedEducation = optionsState.selectedEducation.filter(
				(e) => e !== education
			);
		} else {
			optionsState.selectedEducation = [...optionsState.selectedEducation, education];
		}

		optionsState.selectedIslands = [];
	};

	const handleSexToggle = (sex: string) => {
		const isSelected = optionsState.selectedSexes.includes(sex);

		if (isSelected) {
			optionsState.selectedSexes = optionsState.selectedSexes.filter((s) => s !== sex);
		} else {
			optionsState.selectedSexes = [...optionsState.selectedSexes, sex];
		}

		optionsState.selectedIslands = [];
	};

	const handleIslandToggle = (island: string) => {
		const isSelected = optionsState.selectedIslands.includes(island);

		if (isSelected) {
			optionsState.selectedIslands = optionsState.selectedIslands.filter((i) => i !== island);
		} else {
			optionsState.selectedIslands = [...optionsState.selectedIslands, island];
		}
	};
</script>

<svelte:window bind:innerWidth />

<section class="flex w-full flex-col items-center justify-center gap-5">
	<LineChartEducation {optionsState} />

	<div class="text-center">
		<Button class="ocean-background rounded-2xl " onclick={() => (hidden = false)}
			>Show Options</Button
		>
	</div>

	<Drawer
		class="flex h-full w-full items-center justify-center bg-transparent p-0"
		placement={innerWidth > 1279 ? 'left' : 'top'}
		bind:hidden
	>
		<OptionsSelector
			{optionsState}
			onSkillToggle={handleSkillToggle}
			onEducationToggle={handleEducationToggle}
			onSexToggle={handleSexToggle}
			onIslandToggle={handleIslandToggle}
			bind:hidden
		/>
	</Drawer>
</section>
