<script lang="ts">
	import GeoMap from './DataVizComponents/Geo/GeoMap.svelte';
	import { appData } from '../../state.svelte';

	const optionsState = $state({
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
		},
		coordinatesIslands: {
			'French Polynesia': { lat: -17.68, lng: -149.407 },
			Niue: { lat: -19.054, lng: -169.867 },
			'New Caledonia': { lat: -20.904, lng: 165.618 },
			Tonga: { lat: -21.179, lng: -175.198 },
			'Marshall Islands': { lat: 11.604, lng: 165.313 },
			Vanuatu: { lat: -15.377, lng: 166.959 },
			Nauru: { lat: -0.523, lng: 166.932 },
			Samoa: { lat: -13.759, lng: -172.105 },
			Fiji: { lat: -17.713, lng: 178.065 },
			'Papua New Guinea': { lat: -6.315, lng: 143.956 },
			Palau: { lat: 7.366, lng: 134.434 },
			Micronesia: { lat: 7.426, lng: 150.551 },
			Kiribati: { lat: 1.421, lng: 172.985 },
			'Solomon Islands': { lat: -9.646, lng: 160.156 },
			'Cook Islands': { lat: -21.237, lng: -159.778 },
			Tuvalu: { lat: -7.11, lng: 177.646 }
		}
	});

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
</script>

<section class="geo-section">
	<!-- Map Section Header -->
	<div class="mb-8 text-center">
		<div
			class="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200/50"
		>
			<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 5.447-2.724A1 1 0 0121 3.382v10.764a1 1 0 01-.553.894L15 18l-6-3z"
				/>
			</svg>
			<span>Interactive Map</span>
		</div>
		<h2 class="text-2xl font-bold text-gray-900 lg:text-3xl">Geographic Distribution</h2>
		<p class="mt-2 text-gray-600">
			Click and explore education data points across Pacific Island nations
		</p>
	</div>
	<GeoMap
		{optionsState}
		{filteredData}
		{handleSkillToggle}
		{handleSexToggle}
		{handleEducationToggle}
	/>
</section>
