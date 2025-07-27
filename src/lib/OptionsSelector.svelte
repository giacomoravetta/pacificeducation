<script lang="ts">
	import { appData } from '../state.svelte';

	import { translate } from '../translate_util';

	interface Props {
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
		compare?: boolean;
	}

	let {
		optionsState,
		onSkillToggle,
		onEducationToggle,
		onSexToggle,
		onIslandToggle,
		compare
	}: Props = $props();

	// Derive static lists from data using Svelte 5 runes
	const skills = $derived([
		...new Set(appData.skills.map((skill) => skill['COMPOSITE_BREAKDOWN']))
	]);
	const educationTypes = $derived([...new Set(appData.skills.map((skill) => skill['EDUCATION']))]);
	const sexes = $derived([...new Set(appData.skills.map((skill) => skill['SEX']))]);

	// Filter data based on current selections
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

	// Derive available islands from filtered data
	const islands = $derived([...new Set(filteredData.map((d) => d['GEO_PICT']))]);

	// Utility functions
	const determineOptionType = (selectedOption: string): string | undefined => {
		if (islands.includes(selectedOption)) return 'island';
		if (skills.includes(selectedOption)) return 'skill';
		if (educationTypes.includes(selectedOption)) return 'education';
		if (sexes.includes(selectedOption)) return 'sex';
		return undefined;
	};

	// Handler for filter selection
	const handleFilterClick = (e: MouseEvent) => {
		const target = e.currentTarget as HTMLElement;
		const selectedOption = translate(target.innerText.trim());
		const optionType = determineOptionType(selectedOption);

		switch (optionType) {
			case 'island':
				onIslandToggle?.(selectedOption);
				break;
			case 'skill':
				onSkillToggle?.(selectedOption);
				break;
			case 'education':
				onEducationToggle?.(selectedOption);
				break;
			case 'sex':
				onSexToggle?.(selectedOption);
				break;
		}
	};

	// Drag scrolling attachment (Svelte 5 modern approach)
	function dragScroll(node: HTMLElement) {
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
			const walk = (x - startX) * 2;
			node.scrollLeft = scrollLeft - walk;
		};

		const handleClick = (e: MouseEvent) => {
			if (isDragging && node.classList.contains('islands-section')) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		node.addEventListener('mousedown', handleMouseDown);
		node.addEventListener('mouseleave', handleMouseLeave);
		node.addEventListener('mouseup', handleMouseUp);
		node.addEventListener('mousemove', handleMouseMove);
		node.addEventListener('click', handleClick, true);

		return {
			destroy() {
				node.removeEventListener('mousedown', handleMouseDown);
				node.removeEventListener('mouseleave', handleMouseLeave);
				node.removeEventListener('mouseup', handleMouseUp);
				node.removeEventListener('mousemove', handleMouseMove);
				node.removeEventListener('click', handleClick, true);
			}
		};
	}

	// Helper functions for determining chip states
	const isSkillAvailable = (skill: string) => {
		return (
			filteredData.some((d) => d['COMPOSITE_BREAKDOWN'] === skill) ||
			optionsState.selectedSkills.includes(skill) ||
			optionsState.selectedSkills.length === 0
		);
	};

	const isEducationAvailable = (education: string) => {
		return (
			filteredData.some((d) => d['EDUCATION'] === education) ||
			optionsState.selectedEducation.includes(education) ||
			optionsState.selectedEducation.length === 0
		);
	};

	const isSexAvailable = (sex: string) => {
		return (
			filteredData.some((d) => d['SEX'] === sex) ||
			optionsState.selectedSexes.includes(sex) ||
			optionsState.selectedSexes.length === 0
		);
	};

	const areIslandsEnabled = () => {
		return (
			optionsState.selectedSkills.length > 0 ||
			optionsState.selectedEducation.length > 0 ||
			optionsState.selectedSexes.length > 0
		);
	};
</script>

<div
	class="ocean-background
	relative flex w-full flex-col
	overflow-hidden
	rounded-3xl border
	border-white/20
	shadow-[0_20px_25px_-5px_rgb(0_0_0_/_0.1),0_10px_10px_-5px_rgb(0_0_0_/_0.04)]
	backdrop-blur-lg before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10
	before:to-transparent
"
>
	<!-- Skills Section -->
	<div
		class="
		relative border-b border-white/15
		px-6 py-6
		transition-all duration-300 ease-out
		hover:bg-white/5
	"
	>
		<div class="mb-4 flex items-center gap-3">
			<div
				class="
				flex h-8 w-8
				items-center justify-center rounded-lg
				bg-white/20 text-[min(3dvw,17px)]
				text-white backdrop-blur-sm
			"
			>
				🧮
			</div>
			<h3 class=" text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Skills</h3>
		</div>
		<div
			class="
			flex
			cursor-grab
			gap-3
			overflow-x-auto
			scroll-smooth
			pb-2
			text-white
			active:cursor-grabbing
			[&::-webkit-scrollbar]:h-2
			[&::-webkit-scrollbar-thumb]:rounded-full
			[&::-webkit-scrollbar-thumb]:border-2
			[&::-webkit-scrollbar-thumb]:border-white/20
			[&::-webkit-scrollbar-thumb]:bg-gradient-to-r
			[&::-webkit-scrollbar-thumb]:from-blue-400/60
			[&::-webkit-scrollbar-thumb]:to-cyan-300/60
			[&::-webkit-scrollbar-thumb]:backdrop-blur-sm
			[&::-webkit-scrollbar-thumb]:transition-all
			[&::-webkit-scrollbar-thumb]:duration-300 hover:[&::-webkit-scrollbar-thumb]:from-blue-300/80
			hover:[&::-webkit-scrollbar-thumb]:to-cyan-200/80 hover:[&::-webkit-scrollbar-thumb]:shadow-lg
			hover:[&::-webkit-scrollbar-thumb]:shadow-blue-500/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-track]:backdrop-blur-sm
		"
			style="scrollbar-width: thin; scrollbar-color: rgba(96, 165, 250, 0.6) rgba(255, 255, 255, 0.1);"
			dragScroll
		>
			{#each skills as skill (skill)}
				{@const isSelected = optionsState.selectedSkills.includes(skill)}
				{@const isAvailable = isSkillAvailable(skill)}
				<button
					disabled={!isAvailable}
					onclick={handleFilterClick}
					class="
						cubic-bezier(0.4, 0, 0.2, 1) flex flex-shrink-0 transform-gpu
						items-center gap-2 rounded-2xl
						border border-white/20 bg-white/15
						px-5 py-3
						text-[min(3dvw,17px)] font-medium whitespace-nowrap backdrop-blur-sm
						transition-all
						duration-300

						{isSelected ? 'border-white/80 bg-white/90 text-blue-900 shadow-lg' : ''}
						{!isAvailable
						? 'pointer-events-none cursor-not-allowed opacity-30'
						: 'hover:border-white/40 hover:bg-white/25 hover:shadow-lg active:scale-95'}
					"
				>
					<span>{translate(skill)}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Education Section -->
	<div
		class="
		relative border-b border-white/15
		px-6 py-6
		transition-all duration-300 ease-out
		hover:bg-white/5
	"
	>
		<div class="mb-4 flex items-center gap-3">
			<div
				class="
				flex h-8 w-8
				items-center justify-center rounded-lg
				bg-white/20 text-[min(3dvw,17px)]
				text-white
				backdrop-blur-sm
			"
			>
				📚
			</div>
			<h3 class=" text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Education</h3>
		</div>
		<div
			class="
			flex
			cursor-grab
			gap-3
			overflow-x-auto
			scroll-smooth
			pb-2
			text-white
			active:cursor-grabbing
			[&::-webkit-scrollbar]:h-2
			[&::-webkit-scrollbar-thumb]:rounded-full
			[&::-webkit-scrollbar-thumb]:border-2
			[&::-webkit-scrollbar-thumb]:border-white/20
			[&::-webkit-scrollbar-thumb]:bg-gradient-to-r
			[&::-webkit-scrollbar-thumb]:from-emerald-400/60
			[&::-webkit-scrollbar-thumb]:to-teal-300/60
			[&::-webkit-scrollbar-thumb]:backdrop-blur-sm
			[&::-webkit-scrollbar-thumb]:transition-all
			[&::-webkit-scrollbar-thumb]:duration-300 hover:[&::-webkit-scrollbar-thumb]:from-emerald-300/80
			hover:[&::-webkit-scrollbar-thumb]:to-teal-200/80
			hover:[&::-webkit-scrollbar-thumb]:shadow-lg hover:[&::-webkit-scrollbar-thumb]:shadow-emerald-500/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-track]:backdrop-blur-sm
		"
			style="scrollbar-width: thin; scrollbar-color: rgba(52, 211, 153, 0.6) rgba(255, 255, 255, 0.1);"
			dragScroll
		>
			{#each educationTypes as education (education)}
				{@const isSelected = optionsState.selectedEducation.includes(education)}
				{@const isAvailable = isEducationAvailable(education)}
				<button
					disabled={!isAvailable}
					onclick={handleFilterClick}
					class="
						cubic-bezier(0.4, 0, 0.2, 1) flex flex-shrink-0
						transform-gpu items-center gap-2
						rounded-2xl border border-white/20
						bg-white/15 px-5
						py-3 text-[min(3dvw,17px)] font-medium
						whitespace-nowrap
						backdrop-blur-sm transition-all
						duration-300

						{isSelected ? 'border-white/80 bg-white/90 text-blue-900 shadow-lg' : ''}
						{!isAvailable
						? 'pointer-events-none cursor-not-allowed opacity-30'
						: 'hover:border-white/40 hover:bg-white/25 hover:shadow-lg active:scale-95'}

					"
				>
					<span>{translate(education)}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Gender Section -->
	<div
		class="
		relative border-b border-white/15
		px-6 py-6
		transition-all duration-300 ease-out
		hover:bg-white/5
	"
	>
		<div class="mb-4 flex items-center gap-3">
			<div
				class="
				flex h-8 w-8
				items-center justify-center rounded-lg
				bg-white/20 text-[min(3dvw,17px)]
				text-white backdrop-blur-sm
			"
			>
				🧑
			</div>
			<h3 class=" text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Gender</h3>
		</div>
		<div
			class="
			flex
			cursor-grab
			gap-3
			overflow-x-auto
			scroll-smooth
			pb-2
			text-xs
			text-white active:cursor-grabbing

			[&::-webkit-scrollbar]:h-2
			[&::-webkit-scrollbar-thumb]:rounded-full
			[&::-webkit-scrollbar-thumb]:border-2
			[&::-webkit-scrollbar-thumb]:border-white/20
			[&::-webkit-scrollbar-thumb]:bg-gradient-to-r
			[&::-webkit-scrollbar-thumb]:from-purple-400/60
			[&::-webkit-scrollbar-thumb]:to-pink-300/60
			[&::-webkit-scrollbar-thumb]:backdrop-blur-sm
			[&::-webkit-scrollbar-thumb]:transition-all
			[&::-webkit-scrollbar-thumb]:duration-300 hover:[&::-webkit-scrollbar-thumb]:from-purple-300/80
			hover:[&::-webkit-scrollbar-thumb]:to-pink-200/80
			hover:[&::-webkit-scrollbar-thumb]:shadow-lg hover:[&::-webkit-scrollbar-thumb]:shadow-purple-500/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-track]:backdrop-blur-sm
		"
			style="scrollbar-width: thin; scrollbar-color: rgba(196, 181, 253, 0.6) rgba(255, 255, 255, 0.1);"
			dragScroll
		>
			{#each sexes as sex (sex)}
				{@const isSelected = optionsState.selectedSexes.includes(sex)}
				{@const isAvailable = isSexAvailable(sex)}
				<button
					disabled={!isAvailable}
					onclick={handleFilterClick}
					class="
						cubic-bezier(0.4, 0, 0.2, 1) flex flex-shrink-0
						transform-gpu items-center gap-2
						rounded-2xl border border-white/20
						bg-white/15 px-5
						py-3 text-[min(3dvw,17px)] font-medium
						whitespace-nowrap
						backdrop-blur-sm
						transition-all duration-300

						{isSelected ? 'border-white/80 bg-white/90 text-blue-900 shadow-lg' : ''}
						{!isAvailable
						? 'pointer-events-none cursor-not-allowed opacity-30'
						: 'hover:border-white/40 hover:bg-white/25 hover:shadow-lg active:scale-95'}
					"
				>
					<span>{translate(sex)}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Islands Section -->
	<div
		class="
		relative px-6 py-6
		transition-all duration-300 ease-out
		hover:bg-white/5
	"
	>
		<div class="mb-4 flex items-center gap-3">
			<div
				class="
				flex h-8 w-8
				items-center justify-center rounded-lg
				bg-white/20 text-[min(3dvw,17px)]
				text-white backdrop-blur-sm
			"
			>
				🏝️
			</div>
			<h3 class=" text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Islands</h3>
		</div>
		<div
			class="
			islands-section
			flex
			cursor-grab
			gap-3
			overflow-x-auto
			scroll-smooth
			pb-2
			active:cursor-grabbing
			[&::-webkit-scrollbar]:h-2
			[&::-webkit-scrollbar-thumb]:rounded-full
			[&::-webkit-scrollbar-thumb]:border-2
			[&::-webkit-scrollbar-thumb]:border-white/20
			[&::-webkit-scrollbar-thumb]:bg-gradient-to-r
			[&::-webkit-scrollbar-thumb]:from-orange-400/60
			[&::-webkit-scrollbar-thumb]:via-amber-300/60
			[&::-webkit-scrollbar-thumb]:to-yellow-300/60
			[&::-webkit-scrollbar-thumb]:backdrop-blur-sm
			[&::-webkit-scrollbar-thumb]:transition-all
			[&::-webkit-scrollbar-thumb]:duration-300
			hover:[&::-webkit-scrollbar-thumb]:from-orange-300/80 hover:[&::-webkit-scrollbar-thumb]:via-amber-200/80
			hover:[&::-webkit-scrollbar-thumb]:to-yellow-200/80
			hover:[&::-webkit-scrollbar-thumb]:shadow-lg hover:[&::-webkit-scrollbar-thumb]:shadow-amber-500/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/10
			[&::-webkit-scrollbar-track]:backdrop-blur-sm
		"
			style="scrollbar-width: thin; scrollbar-color: rgba(251, 191, 36, 0.6) rgba(255, 255, 255, 0.1);"
			dragScroll
		>
			{#each islands as island (island)}
				{@const isSelected = optionsState.selectedIslands.includes(island)}
				{@const isEnabled = areIslandsEnabled()}
				{@const islandColor = optionsState.colorsIslands[island] || '#3b82f6'}
				<button
					disabled={!isEnabled ||
						(!isSelected && optionsState.selectedIslands.length != 0 && compare)}
					onclick={handleFilterClick}
					class="
					cubic-bezier(0.4, 0,
						0.2, 1) flex flex-shrink-0 transform-gpu items-center
						gap-2 rounded-2xl px-5
						py-3 text-[min(3dvw,17px)] font-medium whitespace-nowrap text-white backdrop-blur-sm
						transition-all
						duration-300
						{isSelected ? `border shadow-lg` : 'border border-white/20 bg-white/15'}
						{!isEnabled || (!isSelected && optionsState.selectedIslands.length != 0 && compare)
						? 'pointer-events-none cursor-not-allowed opacity-30'
						: 'hover:bg-white/25 hover:shadow-lg '}
					"
					style="
						{isSelected ? `background: ${islandColor}; border-color: ${islandColor};` : ''}
					"
				>
					<span>{island}</span>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	/* Ensure grab cursor works consistently across browsers */
	.cursor-grabbing {
		cursor: grabbing !important;
		cursor: -webkit-grabbing !important;
		cursor: -moz-grabbing !important;
	}
</style>
