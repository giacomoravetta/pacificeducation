<script lang="ts">
	import { appData } from '../../state.svelte';
	import LineChartEducationCompare from '$lib/LineChartEducationCompare.svelte';
	import OptionsSelectorCompare from '$lib/OptionsSelectorCompare.svelte';

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

	// Helper functions (if needed by other components)
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

	// Helper functions for first options state
	const isFirstIslandSelected = (islandName: string) => {
		return firstOptionsState.selectedIslands.includes(islandName);
	};

	const isFirstSkillSelected = (skillName: string) => {
		return firstOptionsState.selectedSkills.includes(skillName);
	};

	const isFirstEducationSelected = (education: string) => {
		return firstOptionsState.selectedEducation.includes(education);
	};

	const isFirstSexSelected = (sex: string) => {
		return firstOptionsState.selectedSexes.includes(sex);
	};

	// Helper functions for second options state
	const isSecondIslandSelected = (islandName: string) => {
		return secondOptionsState.selectedIslands.includes(islandName);
	};

	const isSecondSkillSelected = (skillName: string) => {
		return secondOptionsState.selectedSkills.includes(skillName);
	};

	const isSecondEducationSelected = (education: string) => {
		return secondOptionsState.selectedEducation.includes(education);
	};

	const isSecondSexSelected = (sex: string) => {
		return secondOptionsState.selectedSexes.includes(sex);
	};
</script>

<section class="flex w-full flex-col items-center justify-center bg-yellow-50 p-20">
	<LineChartEducationCompare {firstOptionsState} {secondOptionsState} />

	<div class="flex w-full gap-2">
		<!-- First Options Selector -->
		<div class="w-1/2">
			<h3 class="mb-4 text-lg font-semibold text-blue-600">Dataset 1 Options</h3>
			<OptionsSelectorCompare
				optionsState={firstOptionsState}
				onSkillToggle={handleFirstSkillToggle}
				onEducationToggle={handleFirstEducationToggle}
				onSexToggle={handleFirstSexToggle}
				onIslandToggle={handleFirstIslandToggle}
			/>
		</div>

		<!-- Second Options Selector -->
		<div class="w-1/2">
			<h3 class="mb-4 text-lg font-semibold text-red-600">Dataset 2 Options</h3>
			<OptionsSelectorCompare
				optionsState={secondOptionsState}
				onSkillToggle={handleSecondSkillToggle}
				onEducationToggle={handleSecondEducationToggle}
				onSexToggle={handleSecondSexToggle}
				onIslandToggle={handleSecondIslandToggle}
			/>
		</div>
	</div>
</section>
