<script lang="ts">
	import { appState, appData } from '../state.svelte';

	const skills = [...new Set(appData.skills.map((skill) => skill['COMPOSITE_BREAKDOWN']))];
	const educationTypes = [...new Set(appData.skills.map((skill) => skill['EDUCATION']))];
	const sexes = [...new Set(appData.skills.map((skill) => skill['SEX']))];

	const filteredData = $derived.by(() => {
		return appData.skills.filter((d) => {
			// Filter by islands - if no islands selected, include all
			// const islandMatch =
			// 	appState.selectedIslands.length === 0 || appState.selectedIslands.includes(d.GEO_PICT);

			// Filter by skills - if no skills selected, include all
			const skillMatch =
				appState.selectedSkills.length === 0 ||
				appState.selectedSkills.includes(d.COMPOSITE_BREAKDOWN);

			// Filter by education - if no education selected, include all
			const educationMatch =
				appState.selectedEducation.length === 0 || appState.selectedEducation.includes(d.EDUCATION);

			// Filter by sex - if no sexes selected, include all
			const sexMatch =
				appState.selectedSexes.length === 0 || appState.selectedSexes.includes(d.SEX);

			// Return true only if all conditions match
			return skillMatch && educationMatch && sexMatch;
		});
	});

	const islands = $derived([...new Set(filteredData.map((d) => d['GEO_PICT']))]);

	const determineOptionType = (selectedOption) => {
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

	const isIslandSelected = (islandName) => {
		return appState.selectedIslands.includes(islandName);
	};
	const isSkillSelected = (skillName) => {
		return appState.selectedSkills.includes(skillName);
	};

	const isEducationSelected = (age) => {
		return appState.selectedEducation.includes(age);
	};

	const isSexSelected = (sex) => {
		return appState.selectedSexes.includes(sex);
	};

	const handleClick = (e) => {
		console.log(filteredData);
		const selectedOption = e.currentTarget.innerText.trim();

		const optionType = determineOptionType(selectedOption);

		if (optionType == 'island') {
			const isSelected = isIslandSelected(selectedOption);

			if (isSelected) {
				appState.selectedIslands = appState.selectedIslands.filter(
					(island) => island !== selectedOption
				);
			} else {
				appState.selectedIslands = [...appState.selectedIslands, selectedOption];
			}
		} else if (optionType == 'skill') {
			const isSelected = isSkillSelected(selectedOption);

			if (isSelected) {
				appState.selectedSkills = appState.selectedSkills.filter(
					(skill) => skill !== selectedOption
				);
			} else {
				appState.selectedSkills = [...appState.selectedSkills, selectedOption];
			}
		} else if (optionType == 'education') {
			const isSelected = isEducationSelected(selectedOption);

			if (isSelected) {
				appState.selectedEducation = appState.selectedEducation.filter(
					(skill) => skill !== selectedOption
				);
			} else {
				appState.selectedEducation = [...appState.selectedEducation, selectedOption];
			}
		} else if (optionType == 'sex') {
			const isSelected = isSexSelected(selectedOption);

			if (isSelected) {
				appState.selectedSexes = appState.selectedSexes.filter((skill) => skill !== selectedOption);
			} else {
				appState.selectedSexes = [...appState.selectedSexes, selectedOption];
			}
		}
	};
</script>

<div
	class="no-scrollbar flex w-full flex-row items-center justify-start gap-3 overflow-x-scroll bg-blue-500/20 p-4"
>
	{#each skills as skill}
		<div
			class="flex flex-row items-center justify-center gap-3 rounded-2xl border p-2 text-nowrap text-gray-700"
			style="border-color: {appState.selectedSkills.includes(skill)
				? 'var(--color-primary-600)'
				: '#c9c9c933'}; background-color: {appState.selectedSkills.includes(skill)
				? 'var(--color-primary-600)'
				: '#c9c9c933'}; {filteredData.map((d) => d['COMPOSITE_BREAKDOWN']).includes(skill) ||
			appState.selectedSkills.includes(skill) ||
			appState.selectedSkills.length == 0
				? 'opacity:100%'
				: 'opacity: 20%'}"
		>
			<button
				disabled={filteredData.map((d) => d['COMPOSITE_BREAKDOWN']).includes(skill) ||
				appState.selectedSkills.includes(skill) ||
				appState.selectedSkills.length == 0
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
	class="no-scrollbar flex w-full flex-row items-center justify-start gap-3 overflow-x-scroll
	bg-blue-500/20 p-4"
>
	{#each educationTypes as education}
		<div
			class="flex flex-row items-center justify-center gap-3 rounded-2xl border p-2 text-nowrap text-gray-700"
			style="border-color: {appState.selectedEducation.includes(education)
				? 'var(--color-primary-600)'
				: '#c9c9c933'}; background-color: {appState.selectedEducation.includes(education)
				? 'var(--color-primary-600)'
				: '#c9c9c933'}; {filteredData.map((d) => d['EDUCATION']).includes(education) ||
			appState.selectedEducation.includes(education) ||
			appState.selectedEducation.length == 0
				? 'opacity: 100%'
				: 'opacity: 20%'}"
		>
			<button
				disabled={filteredData.map((d) => d['EDUCATION']).includes(education) ||
				appState.selectedEducation.includes(education) ||
				appState.selectedEducation.length == 0
					? false
					: true}
				onclick={handleClick}>{education}</button
			>
		</div>
	{/each}
</div>
<div
	class="no-scrollbar flex w-full flex-row items-center justify-start gap-3 overflow-x-scroll
	bg-blue-500/20 p-4"
>
	{#each sexes as sex}
		<div
			class="flex flex-row items-center justify-center gap-3 rounded-2xl border p-2 text-nowrap text-gray-700"
			style="border-color: {appState.selectedSexes.includes(sex)
				? 'var(--color-primary-600)'
				: '#c9c9c933'}; background-color: {appState.selectedSexes.includes(sex)
				? 'var(--color-primary-600)'
				: '#c9c9c933'}; {filteredData.map((d) => d['SEX']).includes(sex) ||
			appState.selectedSexes.includes(sex) ||
			appState.selectedSexes.length == 0
				? 'opacity: 100%'
				: 'opacity: 20%'}"
		>
			<button
				disabled={filteredData.map((d) => d['SEX']).includes(sex) ||
				appState.selectedSexes.includes(sex) ||
				appState.selectedSexes.length == 0
					? false
					: true}
				onclick={handleClick}>{sex}</button
			>
		</div>
	{/each}
</div>

<div
	class="no-scrollbar flex w-full flex-row items-center justify-start gap-3 overflow-x-scroll bg-blue-500/20 p-4"
>
	{#each islands as island}
		<div
			class="flex flex-row items-center justify-center gap-3 rounded-2xl border p-2 text-nowrap text-gray-700"
			style="border-color: {appState.selectedIslands.includes(island)
				? appState.colorsIslands[island] + '33'
				: '#c9c9c933'}; background-color: {appState.selectedIslands.includes(island)
				? appState.colorsIslands[island] + '33'
				: '#c9c9c933'};{appState.selectedSexes.length > 0 &&
			appState.selectedEducation.length > 0 &&
			appState.selectedSexes.length > 0
				? 'opacity: 100%'
				: 'opacity:30%'}"
		>
			<button
				disabled={appState.selectedSexes.length > 0 &&
				appState.selectedEducation.length > 0 &&
				appState.selectedSexes.length > 0
					? false
					: true}
				onclick={handleClick}>{island}</button
			>
		</div>
	{/each}
</div>
