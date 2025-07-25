<script lang="ts">
	import LineChartEducationGeneric from '$lib/LineChartEducationGeneric.svelte';
	import OptionsSelectorGeneric from '$lib/OptionsSelectorGeneric.svelte';
	import { appData } from '../../state.svelte';

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
			// Filter by skills - if no skills selected, include all
			const skillMatch =
				optionsState.selectedSkills.length === 0 ||
				optionsState.selectedSkills.includes(d.COMPOSITE_BREAKDOWN);
			// Filter by education - if no education selected, include all
			const educationMatch =
				optionsState.selectedEducation.length === 0 ||
				optionsState.selectedEducation.includes(d.EDUCATION);
			// Filter by sex - if no sexes selected, include all
			const sexMatch =
				optionsState.selectedSexes.length === 0 || optionsState.selectedSexes.includes(d.SEX);
			// Return true only if all conditions match
			return skillMatch && educationMatch && sexMatch;
		});
	});

	const islands = $derived([...new Set(filteredData.map((d) => d['GEO_PICT']))]);

	// Callback handlers for the OptionsSelectorGeneric component
	const handleSkillToggle = (skill: string) => {
		const isSelected = optionsState.selectedSkills.includes(skill);

		if (isSelected) {
			optionsState.selectedSkills = optionsState.selectedSkills.filter((s) => s !== skill);
		} else {
			optionsState.selectedSkills = [...optionsState.selectedSkills, skill];
		}

		// Clear islands when skills change (based on your original logic)
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

		// Clear islands when education changes
		optionsState.selectedIslands = [];
	};

	const handleSexToggle = (sex: string) => {
		const isSelected = optionsState.selectedSexes.includes(sex);

		if (isSelected) {
			optionsState.selectedSexes = optionsState.selectedSexes.filter((s) => s !== sex);
		} else {
			optionsState.selectedSexes = [...optionsState.selectedSexes, sex];
		}

		// Clear islands when sex changes
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

	// You can keep these helper functions if LineChartEducationGeneric needs them
	// Or pass them as additional props if needed
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

<section class="flex w-full flex-col items-center justify-center gap-5 bg-yellow-50 p-2">
	<LineChartEducationGeneric {optionsState} />
	<OptionsSelectorGeneric
		{optionsState}
		onSkillToggle={handleSkillToggle}
		onEducationToggle={handleEducationToggle}
		onSexToggle={handleSexToggle}
		onIslandToggle={handleIslandToggle}
	/>
</section>
