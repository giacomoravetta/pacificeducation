<script lang="ts">
	import { appData } from '../state.svelte';

	let { optionsState, onSkillToggle, onEducationToggle, onSexToggle, onIslandToggle } = $props<{
		optionsState: {
			selectedSkills: string[];
			selectedEducation: string[];
			selectedSexes: string[];
			selectedIslands: string[];
			colorsIslands: Record<string, string>;
		};
		onSkillToggle?: (skill: string) => void;
		onEducationToggle?: (education: string) => void;
		onSexToggle?: (sex: string) => void;
		onIslandToggle?: (island: string) => void;
	}>();

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

	const isSkillSelected = (skillName: string) => {
		return optionsState.selectedSkills.includes(skillName);
	};

	const isEducationSelected = (education: string) => {
		return optionsState.selectedEducation.includes(education);
	};

	const isSexSelected = (sex: string) => {
		return optionsState.selectedSexes.includes(sex);
	};

	const isIslandSelected = (islandName: string) => {
		return optionsState.selectedIslands.includes(islandName);
	};

	const handleClick = (e: Event) => {
		console.log(filteredData);
		const selectedOption = (e.currentTarget as HTMLElement).innerText.trim();
		const optionType = determineOptionType(selectedOption);

		if (optionType === 'island') {
			onIslandToggle?.(selectedOption);
		} else if (optionType === 'skill') {
			onSkillToggle?.(selectedOption);
		} else if (optionType === 'education') {
			onEducationToggle?.(selectedOption);
		} else if (optionType === 'sex') {
			onSexToggle?.(selectedOption);
		}
	};
</script>

<div class="flex w-full flex-col bg-[var(--color-primary-400)]/20">
	<div
		class="no-scrollbar b flex w-full flex-row items-center justify-start gap-3 overflow-x-scroll border-b border-[var(--color-secondary-400)] p-4"
	>
		{#each skills as skill}
			<div
				class="flex flex-row items-center justify-center gap-3 rounded-2xl p-2 text-nowrap text-gray-700"
				style="border-color: {optionsState.selectedSkills.includes(skill)
					? 'var(--color-primary-600)'
					: '#c9c9c933'}; background-color: {optionsState.selectedSkills.includes(skill)
					? 'var(--color-primary-600)'
					: '#c9c9c933'}; {filteredData.map((d) => d['COMPOSITE_BREAKDOWN']).includes(skill) ||
				optionsState.selectedSkills.includes(skill) ||
				optionsState.selectedSkills.length == 0
					? 'opacity:100%'
					: 'opacity: 20%'}"
			>
				<button
					disabled={filteredData.map((d) => d['COMPOSITE_BREAKDOWN']).includes(skill) ||
					optionsState.selectedSkills.includes(skill) ||
					optionsState.selectedSkills.length == 0
						? false
						: true}
					onclick={handleClick}
				>
					{skill}
				</button>
			</div>
		{/each}
	</div>
	<div
		class="no-scrollbar bg-blue-500/ flex w-full flex-row items-center justify-start gap-3
	overflow-x-scroll border-b border-[var(--color-secondary-400)] p-4"
	>
		{#each educationTypes as education}
			<div
				class="flex flex-row items-center justify-center gap-3 rounded-2xl border p-2 text-nowrap text-gray-700"
				style="border-color: {optionsState.selectedEducation.includes(education)
					? 'var(--color-primary-600)'
					: '#c9c9c933'}; background-color: {optionsState.selectedEducation.includes(education)
					? 'var(--color-primary-600)'
					: '#c9c9c933'}; {filteredData.map((d) => d['EDUCATION']).includes(education) ||
				optionsState.selectedEducation.includes(education) ||
				optionsState.selectedEducation.length == 0
					? 'opacity: 100%'
					: 'opacity: 20%'}"
			>
				<button
					disabled={filteredData.map((d) => d['EDUCATION']).includes(education) ||
					optionsState.selectedEducation.includes(education) ||
					optionsState.selectedEducation.length == 0
						? false
						: true}
					onclick={handleClick}>{education}</button
				>
			</div>
		{/each}
	</div>
	<div
		class="no-scrollbar flex w-full flex-row items-center justify-start gap-3 overflow-x-scroll border-b border-[var(--color-secondary-400)] p-4"
	>
		{#each sexes as sex}
			<div
				class="flex flex-row items-center justify-center gap-3 rounded-2xl border p-2 text-nowrap text-gray-700"
				style="border-color: {optionsState.selectedSexes.includes(sex)
					? 'var(--color-primary-600)'
					: '#c9c9c933'}; background-color: {optionsState.selectedSexes.includes(sex)
					? 'var(--color-primary-600)'
					: '#c9c9c933'}; {filteredData.map((d) => d['SEX']).includes(sex) ||
				optionsState.selectedSexes.includes(sex) ||
				optionsState.selectedSexes.length == 0
					? 'opacity: 100%'
					: 'opacity: 20%'}"
			>
				<button
					disabled={filteredData.map((d) => d['SEX']).includes(sex) ||
					optionsState.selectedSexes.includes(sex) ||
					optionsState.selectedSexes.length == 0
						? false
						: true}
					onclick={handleClick}>{sex}</button
				>
			</div>
		{/each}
	</div>

	<div
		class="no-scrollbar flex w-full flex-row items-center justify-start gap-3 overflow-x-scroll p-4"
	>
		{#each islands as island}
			<div
				class="flex flex-row items-center justify-center gap-3 rounded-2xl border p-2 text-nowrap text-gray-700"
				style="border-color: {optionsState.selectedIslands.includes(island)
					? optionsState.colorsIslands[island] + '33'
					: '#c9c9c933'}; background-color: {optionsState.selectedIslands.includes(island)
					? optionsState.colorsIslands[island] + '33'
					: '#c9c9c933'};{optionsState.selectedSexes.length > 0 &&
				optionsState.selectedEducation.length > 0 &&
				optionsState.selectedSexes.length > 0
					? 'opacity: 100%'
					: 'opacity:30%'}"
			>
				<button
					disabled={optionsState.selectedSexes.length > 0 &&
					optionsState.selectedEducation.length > 0 &&
					optionsState.selectedSexes.length > 0
						? false
						: true}
					onclick={handleClick}>{island}</button
				>
			</div>
		{/each}
	</div>
</div>
