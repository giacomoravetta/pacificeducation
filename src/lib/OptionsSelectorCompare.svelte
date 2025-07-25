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

	// Check if islands can be selected (need at least one selection from each category)
	const canSelectIslands = $derived(
		optionsState.selectedSkills.length > 0 &&
			optionsState.selectedEducation.length > 0 &&
			optionsState.selectedSexes.length > 0
	);

	const handleClick = (e: Event) => {
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

	// Special handler for islands to ensure single selection
	const handleIslandClick = (e: Event) => {
		const selectedIsland = (e.currentTarget as HTMLElement).innerText.trim();

		// If this island is already selected, deselect it
		if (optionsState.selectedIslands.includes(selectedIsland)) {
			onIslandToggle?.(selectedIsland);
		} else {
			// If another island is selected, first deselect it, then select the new one
			if (optionsState.selectedIslands.length > 0) {
				// Clear the currently selected island first
				optionsState.selectedIslands.forEach((island) => {
					onIslandToggle?.(island);
				});
			}

			onIslandToggle?.(selectedIsland);
		}
	};

	// Create sections data with sizes for dynamic ordering
	const sectionsData = $derived.by(() => {
		const sections = [
			{
				name: 'skills',
				title: 'Skills',
				data: skills,
				size: skills.length,
				handler: handleClick,
				selectedItems: optionsState.selectedSkills,
				colorVar: 'var(--color-primary-600)',
				filterField: 'COMPOSITE_BREAKDOWN'
			},
			{
				name: 'education',
				title: 'Education',
				data: educationTypes,
				size: educationTypes.length,
				handler: handleClick,
				selectedItems: optionsState.selectedEducation,
				colorVar: 'var(--color-primary-600)',
				filterField: 'EDUCATION'
			},
			{
				name: 'sex',
				title: 'Sex',
				data: sexes,
				size: sexes.length,
				handler: handleClick,
				selectedItems: optionsState.selectedSexes,
				colorVar: 'var(--color-primary-600)',
				filterField: 'SEX'
			},
			{
				name: 'islands',
				title: 'Islands',
				data: islands,
				size: islands.length,
				handler: handleIslandClick,
				selectedItems: optionsState.selectedIslands,
				colorVar: null, // Islands use custom colors
				filterField: 'GEO_PICT',
				isSpecial: true // Islands have special behavior
			}
		];

		// Sort by size (smallest to largest, so largest appears at bottom)
		return sections.sort((a, b) => a.size - b.size);
	});

	// Drag scrolling functionality - Svelte 5 compatible with $effect
	const createDragScroll = (node: HTMLElement) => {
		let isDown = false;
		let startX: number;
		let scrollLeft: number;
		let isDragging = false;

		const handleMouseDown = (e: MouseEvent) => {
			isDown = true;
			isDragging = false;
			node.classList.add('cursor-grabbing');
			startX = e.pageX - node.offsetLeft;
			scrollLeft = node.scrollLeft;
			e.preventDefault();
		};

		const handleMouseLeave = () => {
			isDown = false;
			node.classList.remove('cursor-grabbing');
		};

		const handleMouseUp = () => {
			isDown = false;
			node.classList.remove('cursor-grabbing');
			// Small delay to prevent click events if we were dragging
			if (isDragging) {
				setTimeout(() => {
					isDragging = false;
				}, 10);
			}
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!isDown) return;
			e.preventDefault();
			isDragging = true;
			const x = e.pageX - node.offsetLeft;
			const walk = (x - startX) * 2; // Scroll speed multiplier
			node.scrollLeft = scrollLeft - walk;
		};

		// Prevent click events when dragging - only for islands section
		const handleClick = (e: MouseEvent) => {
			if (isDragging && node.classList.contains('islands-section')) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		// Using $effect for Svelte 5 lifecycle management
		$effect(() => {
			node.addEventListener('mousedown', handleMouseDown);
			node.addEventListener('mouseleave', handleMouseLeave);
			node.addEventListener('mouseup', handleMouseUp);
			node.addEventListener('mousemove', handleMouseMove);
			node.addEventListener('click', handleClick, true);

			return () => {
				node.removeEventListener('mousedown', handleMouseDown);
				node.removeEventListener('mouseleave', handleMouseLeave);
				node.removeEventListener('mouseup', handleMouseUp);
				node.removeEventListener('mousemove', handleMouseMove);
				node.removeEventListener('click', handleClick, true);
			};
		});

		return {
			destroy() {
				// Cleanup is handled by $effect return function
			}
		};
	};
</script>

<div
	class="flex w-full flex-col rounded-2xl bg-gradient-to-b from-blue-500 to-emerald-700/60 text-white"
>
	<!-- Skills Section -->
	<div
		class="no-scrollbar flex w-full cursor-grab flex-row items-center justify-start gap-3 overflow-x-auto border-b border-white/20 p-4 select-none"
		use:createDragScroll
	>
		{#each skills as skill}
			<button
				disabled={!(
					filteredData.map((d) => d['COMPOSITE_BREAKDOWN']).includes(skill) ||
					optionsState.selectedSkills.includes(skill) ||
					optionsState.selectedSkills.length === 0
				)}
				onclick={handleClick}
				class="cursor-pointer"
			>
				<div
					class="flex flex-row items-center justify-center gap-3 rounded-2xl p-2 text-nowrap transition-all duration-200 hover:scale-105"
					style="border: 2px solid {optionsState.selectedSkills.includes(skill)
						? 'var(--color-primary-600)'
						: 'rgba(255,255,255,0.2)'}; background-color: {optionsState.selectedSkills.includes(
						skill
					)
						? 'var(--color-primary-600)'
						: 'rgba(255,255,255,0.1)'}; opacity: {filteredData
						.map((d) => d['COMPOSITE_BREAKDOWN'])
						.includes(skill) ||
					optionsState.selectedSkills.includes(skill) ||
					optionsState.selectedSkills.length === 0
						? '1'
						: '0.3'};"
				>
					{skill}
				</div>
			</button>
		{/each}
	</div>

	<!-- Education Section -->
	<div
		class="no-scrollbar flex w-full cursor-grab flex-row items-center justify-start gap-3 overflow-x-auto border-b border-white/20 p-4 select-none"
		use:createDragScroll
	>
		{#each educationTypes as education}
			<button
				disabled={!(
					filteredData.map((d) => d['EDUCATION']).includes(education) ||
					optionsState.selectedEducation.includes(education) ||
					optionsState.selectedEducation.length === 0
				)}
				onclick={handleClick}
				class="cursor-pointer"
			>
				<div
					class="flex flex-row items-center justify-center gap-3 rounded-2xl border p-2 text-nowrap transition-all duration-200 hover:scale-105"
					style="border: 2px solid {optionsState.selectedEducation.includes(education)
						? 'var(--color-primary-600)'
						: 'rgba(255,255,255,0.2)'}; background-color: {optionsState.selectedEducation.includes(
						education
					)
						? 'var(--color-primary-600)'
						: 'rgba(255,255,255,0.1)'}; opacity: {filteredData
						.map((d) => d['EDUCATION'])
						.includes(education) ||
					optionsState.selectedEducation.includes(education) ||
					optionsState.selectedEducation.length === 0
						? '1'
						: '0.3'};"
				>
					{education}
				</div>
			</button>
		{/each}
	</div>

	<!-- Sex Section -->
	<div
		class="no-scrollbar flex w-full cursor-grab flex-row items-center justify-start gap-3 overflow-x-auto border-b border-white/20 p-4 select-none"
		use:createDragScroll
	>
		{#each sexes as sex}
			<button
				disabled={!(
					filteredData.map((d) => d['SEX']).includes(sex) ||
					optionsState.selectedSexes.includes(sex) ||
					optionsState.selectedSexes.length === 0
				)}
				onclick={handleClick}
				class="cursor-pointer"
			>
				<div
					class="flex flex-row items-center justify-center gap-3 rounded-2xl border p-2 text-nowrap transition-all duration-200 hover:scale-105"
					style="border: 2px solid {optionsState.selectedSexes.includes(sex)
						? 'var(--color-primary-600)'
						: 'rgba(255,255,255,0.2)'}; background-color: {optionsState.selectedSexes.includes(sex)
						? 'var(--color-primary-600)'
						: 'rgba(255,255,255,0.1)'}; opacity: {filteredData.map((d) => d['SEX']).includes(sex) ||
					optionsState.selectedSexes.includes(sex) ||
					optionsState.selectedSexes.length === 0
						? '1'
						: '0.3'};"
				>
					{sex}
				</div>
			</button>
		{/each}
	</div>

	<!-- Islands Section - Single Selection -->
	<div
		class="no-scrollbar islands-section flex w-full cursor-grab flex-row items-center justify-start gap-3 overflow-x-auto p-4 select-none"
		use:createDragScroll
	>
		{#if !canSelectIslands}
			<div class="p-2 text-sm text-white/70 italic">
				Please select at least one option from each category above to enable island selection
			</div>
		{/if}

		{#each islands as island}
			<button
				disabled={!canSelectIslands}
				onclick={handleIslandClick}
				class={canSelectIslands ? 'cursor-pointer' : 'cursor-not-allowed'}
			>
				<div
					class="flex flex-row items-center justify-center gap-3 rounded-2xl border p-2 text-nowrap transition-all duration-200 hover:scale-105"
					style="border: 2px solid {optionsState.selectedIslands.includes(island)
						? optionsState.colorsIslands[island]
						: 'rgba(255,255,255,0.2)'}; background-color: {optionsState.selectedIslands.includes(
						island
					)
						? optionsState.colorsIslands[island]
						: 'rgba(255,255,255,0.1)'}; opacity: {canSelectIslands ? '1' : '0.3'};"
				>
					{island}
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	/* Ensure buttons don't shrink and add pointer cursor for Tailwind 4 */
	.no-scrollbar button {
		flex-shrink: 0;
		cursor: pointer; /* Tailwind 4 compatibility - buttons need explicit pointer */
	}

	/* Disabled buttons should not have pointer cursor */
	.no-scrollbar button:disabled {
		cursor: not-allowed;
	}

	/* Cursor styles for drag scrolling */
	.cursor-grabbing {
		cursor: grabbing !important;
	}

	.cursor-grab:active {
		cursor: grabbing;
	}

	/* Prevent text selection during drag */
	.select-none {
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
</style>
