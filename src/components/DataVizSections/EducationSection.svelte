<script lang="ts">
	import LineChartEducation from './DataVizComponents/Education/LineChartEducation.svelte';
	import OptionsSelector from '$lib/OptionsSelector.svelte';
	import { appData } from '../../state.svelte';
	import { AccordionItem, Accordion } from 'flowbite-svelte';

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

	const skills = [...new Set(appData.skills.map((skill) => skill['COMPOSITE_BREAKDOWN']))];
	const educationTypes = [...new Set(appData.skills.map((skill) => skill['EDUCATION']))];
	const sexes = [...new Set(appData.skills.map((skill) => skill['SEX']))];

	const filteredData = $derived.by(() => {
		return appData.skills.filter((d) => {
			const skillMatch =
				optionsState.selectedSkills.length === 0 ||
				optionsState.selectedSkills.includes(d.COMPOSITE_BREAKDOWN);

			const educationMatch =
				optionsState.selectedEducation.length === 0 ||
				optionsState.selectedEducation.includes(d.EDUCATION);

			const sexMatch =
				optionsState.selectedSexes.length === 0 || optionsState.selectedSexes.includes(d.SEX);

			return skillMatch && educationMatch && sexMatch;
		});
	});

	const islands = $derived([...new Set(filteredData.map((d) => d['GEO_PICT']))]);

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

	const determineOptionType = (selectedOption: string) => {
		if (islands.includes(selectedOption)) {
			return 'island';
		} else if (skills.includes(selectedOption)) {
			return 'skill';
		} else if (educationTypes.includes(selectedOption)) {
			return 'education';
		} else if (sexes.includes(selectedOption)) {
			return 'sex';
		}
	};

	const isIslandSelected = (islandName: string) => {
		return optionsState.selectedIslands.includes(islandName);
	};

	const isSkillSelected = (skillName: string) => {
		return optionsState.selectedSkills.includes(skillName);
	};

	const isEducationSelected = (education: string) => {
		return optionsState.selectedEducation.includes(education);
	};

	const isSexSelected = (sex: string) => {
		return optionsState.selectedSexes.includes(sex);
	};
</script>

<section class="flex w-full flex-col items-center justify-center gap-5">
	<LineChartEducation {optionsState} />

	<Accordion
		class="ocean-background rounded-2xl "
		inactiveClass="ocean-background rounded-2xl hover:bg-white/20 "
		activeClass="ocean-background "
	>
		<AccordionItem>
			{#snippet header()}<h1 class=" text-white">Options</h1>
			{/snippet}
			<OptionsSelector
				{optionsState}
				onSkillToggle={handleSkillToggle}
				onEducationToggle={handleEducationToggle}
				onSexToggle={handleSexToggle}
				onIslandToggle={handleIslandToggle}
			/>
		</AccordionItem>
	</Accordion>
</section>
