<script lang="ts">
	import { scaleLinear } from 'd3';
	import { line, curveLinear } from 'd3';
	import { extent, group } from 'd3';
	import { appData } from '../../../../state.svelte';
	import { translate } from '../../../../translate_util';

	let { optionsState } = $props();

	let selectedPoint = $state({});
	let svgElement = $state();
	let graphWidth = $state(0);

	const filteredData = $derived.by(() => {
		if (
			!optionsState?.selectedIslands ||
			!optionsState?.selectedSkills ||
			!optionsState?.selectedSexes ||
			!optionsState?.selectedEducation
		) {
			return [];
		}

		return appData.skills.filter(
			(d) =>
				optionsState.selectedIslands.includes(d.GEO_PICT) &&
				optionsState.selectedSkills.includes(d.COMPOSITE_BREAKDOWN) &&
				optionsState.selectedSexes.includes(d.SEX) &&
				optionsState.selectedEducation.includes(d.EDUCATION)
		);
	});

	const groupedData = $derived.by(() => {
		return Array.from(group(filteredData, (d) => d.GEO_PICT));
	});

	const descriptionData = $derived.by(() => {
		const totalDataPoints = filteredData.length;
		const uniqueYears = [...new Set(filteredData.map((d) => d.TIME_PERIOD))].sort();
		const yearRange =
			uniqueYears.length > 1
				? `${Math.min(...uniqueYears)} - ${Math.max(...uniqueYears)}`
				: uniqueYears[0]?.toString() || 'No data';

		const averageValue =
			totalDataPoints > 0
				? (filteredData.reduce((sum, d) => sum + +d.OBS_VALUE, 0) / totalDataPoints).toFixed(1)
				: '0';

		return {
			totalDataPoints,
			yearRange,
			averageValue,
			hasData: totalDataPoints > 0
		};
	});

	const descriptionText = $derived(() => {
		if (!optionsState) return 'Loading...';

		const { selectedSkills, selectedEducation, selectedSexes, selectedIslands } = optionsState;

		if (!descriptionData.hasData) {
			return 'No data available for the current selection. Please adjust your filters.';
		}

		const parts = [];

		if (selectedSexes?.length === 1) {
			parts.push(`${translate(selectedSexes[0]).toLowerCase()} individuals`);
		} else if (selectedSexes?.length > 1) {
			parts.push(
				`individuals (${selectedSexes
					.map((sex) => translate(sex))
					.join(', ')
					.toLowerCase()})`
			);
		} else {
			parts.push('all individuals');
		}

		if (selectedEducation?.length === 1) {
			parts.push(`with ${translate(selectedEducation[0]).toLowerCase()} education`);
		} else if (selectedEducation?.length > 1) {
			parts.push(`across ${selectedEducation.length} education levels`);
		}

		if (selectedSkills?.length === 1) {
			parts.push(`in ${translate(selectedSkills[0]).toLowerCase()}`);
		} else if (selectedSkills?.length > 1) {
			parts.push(`across ${selectedSkills.length} skill categories`);
		}

		if (selectedIslands?.length === 1) {
			parts.push(`in ${selectedIslands[0]}`);
		} else if (selectedIslands?.length > 1) {
			parts.push(`across ${selectedIslands.length} islands`);
		}

		const baseText = `Showing education data for ${parts.join(' ')}`;
		const statsText = ` over ${descriptionData.yearRange} (${descriptionData.totalDataPoints} data points, ${descriptionData.averageValue}% average)`;

		return baseText + statsText;
	});

	const margin = { top: 40, right: 40, left: 60, bottom: 50 };
	const graphHeight = 400;

	const xScale = $derived(
		scaleLinear()
			.domain(extent(filteredData, (d) => d.TIME_PERIOD) || [2020, 2023])
			.range([margin.left, graphWidth - margin.right - margin.left])
	);

	const yScale = $derived(
		scaleLinear()
			.domain([0, 100])
			.range([graphHeight - margin.bottom, margin.top])
	);

	const lineGenerator = $derived(
		line()
			.x((d) => xScale(d.TIME_PERIOD))
			.y((d) => yScale(+d.OBS_VALUE))
			.curve(curveLinear)
	);

	function animateLine(node, { delay = 0 } = {}) {
		const pathLength = node.getTotalLength();
		node.style.strokeDasharray = pathLength.toString();
		node.style.strokeDashoffset = pathLength.toString();

		const timeout = setTimeout(() => {
			node.style.transition = 'stroke-dashoffset 1.5s ease-out';
			node.style.strokeDashoffset = '0';
		}, delay);

		return {
			destroy() {
				clearTimeout(timeout);
			}
		};
	}

	const handleMouseEnter = (e, dataPoint) => {
		if (svgElement) {
			const rect = svgElement.getBoundingClientRect();
			selectedPoint = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
				data: dataPoint
			};
		}
	};

	const handleMouseLeave = () => {
		selectedPoint = {};
	};

	const handleClick = (e, dataPoint) => {
		if (svgElement) {
			const rect = svgElement.getBoundingClientRect();
			selectedPoint = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
				data: dataPoint
			};

			setTimeout(() => {
				selectedPoint = {};
			}, 3000);
		}
	};
</script>

<div
	class="flex w-full flex-col items-center justify-center space-y-8 p-6"
	bind:clientWidth={graphWidth}
>
	<div class="w-full max-w-4xl text-center">
		<div
			class="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-200/50"
		>
			<svg class="size-4" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				/>
			</svg>
			Data Visualization
		</div>

		<h2
			class="mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-3xl font-bold text-transparent lg:text-4xl"
		>
			Pacific Education Analytics
		</h2>

		<div class="mx-auto max-w-3xl">
			<p class="text-lg leading-relaxed text-gray-600 lg:text-xl">
				{descriptionText()}
			</p>
		</div>

		{#if descriptionData.hasData}
			<div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div
					class="group rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50"
				>
					<div class="text-3xl font-bold text-blue-600">{descriptionData.totalDataPoints}</div>
					<div class="text-sm font-medium text-gray-600">Data Points</div>
				</div>

				<div
					class="group rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-green-100/50"
				>
					<div class="text-3xl font-bold text-green-600">{descriptionData.yearRange}</div>
					<div class="text-sm font-medium text-gray-600">Time Period</div>
				</div>

				<div
					class="group rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-100/50"
				>
					<div class="text-3xl font-bold text-purple-600">{descriptionData.averageValue}%</div>
					<div class="text-sm font-medium text-gray-600">Average Value</div>
				</div>
			</div>
		{/if}
	</div>

	{#if optionsState}
		<div class="w-full max-w-4xl">
			<div class="mb-4 flex items-center gap-2">
				<svg class="size-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
					/>
				</svg>
				<h3 class="text-sm font-semibold text-gray-700">Active Filters</h3>
			</div>

			<div class="flex flex-wrap gap-3">
				{#if optionsState.selectedSkills?.length > 0}
					{#each optionsState.selectedSkills as skill, index (skill)}
						<div
							class="group flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-2 text-sm font-medium text-blue-800 ring-1 ring-blue-200/50 transition-all duration-200 hover:shadow-md hover:shadow-blue-100/50"
						>
							<div class="flex size-2 items-center justify-center">
								<div
									class="size-2 rounded-full bg-blue-500 transition-transform duration-200 group-hover:scale-110"
								></div>
							</div>
							<span>Skill: {translate(skill)}</span>
						</div>
					{/each}
				{/if}

				{#if optionsState.selectedEducation?.length > 0}
					{#each optionsState.selectedEducation as education, index (education)}
						<div
							class="group flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200/50 transition-all duration-200 hover:shadow-md hover:shadow-emerald-100/50"
						>
							<div class="flex size-2 items-center justify-center">
								<div
									class="size-2 rounded-full bg-emerald-500 transition-transform duration-200 group-hover:scale-110"
								></div>
							</div>
							<span>Education: {translate(education)}</span>
						</div>
					{/each}
				{/if}

				{#if optionsState.selectedSexes?.length > 0}
					{#each optionsState.selectedSexes as sex, index (sex)}
						<div
							class="group flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-100 to-purple-50 px-4 py-2 text-sm font-medium text-purple-800 ring-1 ring-purple-200/50 transition-all duration-200 hover:shadow-md hover:shadow-purple-100/50"
						>
							<div class="flex size-2 items-center justify-center">
								<div
									class="size-2 rounded-full bg-purple-500 transition-transform duration-200 group-hover:scale-110"
								></div>
							</div>
							<span>Gender: {translate(sex)}</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}

	<div class="relative w-full max-w-6xl">
		{#if selectedPoint.data && optionsState?.colorsIslands}
			<div
				class="animate-in fade-in slide-in-from-bottom-2 pointer-events-none absolute z-20 min-w-[240px] rounded-2xl border border-gray-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-sm duration-200"
				style="top: {selectedPoint.y - 10}px; left: {selectedPoint.x > graphWidth / 2
					? selectedPoint.x - 260
					: selectedPoint.x + 15}px;"
			>
				<div class="mb-3 flex items-center gap-3">
					<div
						class="size-4 rounded-full shadow-sm ring-2 ring-white"
						style="background-color: {optionsState.colorsIslands[selectedPoint.data.GEO_PICT]}"
					></div>
					<span class="text-base font-semibold text-gray-900">{selectedPoint.data.GEO_PICT}</span>
				</div>

				<div class="space-y-2">
					<div class="flex items-center justify-between gap-6">
						<span class="text-sm text-gray-600">Year</span>
						<span class="text-sm font-semibold text-gray-900">{selectedPoint.data.TIME_PERIOD}</span
						>
					</div>
					<div class="flex items-center justify-between gap-6">
						<span class="text-sm text-gray-600">Value</span>
						<span class="text-lg font-bold text-blue-600">{selectedPoint.data.OBS_VALUE}%</span>
					</div>
					{#if selectedPoint.data.COMPOSITE_BREAKDOWN}
						<div class="flex items-center justify-between gap-6">
							<span class="text-sm text-gray-600">Skill</span>
							<span class="text-right text-sm font-medium text-gray-900"
								>{translate(selectedPoint.data.COMPOSITE_BREAKDOWN)}</span
							>
						</div>
					{/if}
					{#if selectedPoint.data.EDUCATION}
						<div class="flex items-center justify-between gap-6">
							<span class="text-sm text-gray-600">Education</span>
							<span class="text-right text-sm font-medium text-gray-900"
								>{translate(selectedPoint.data.EDUCATION)}</span
							>
						</div>
					{/if}
					{#if selectedPoint.data.SEX}
						<div class="flex items-center justify-between gap-6">
							<span class="text-sm text-gray-600">Gender</span>
							<span class="text-right text-sm font-medium text-gray-900"
								>{translate(selectedPoint.data.SEX)}</span
							>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<div
			class="rounded-3xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50/30 p-6 shadow-lg"
		>
			<svg
				bind:this={svgElement}
				width={graphWidth}
				height={graphHeight}
				class="overflow-visible rounded-xl"
			>
				<g class="grid">
					{#each xScale.ticks(8).filter((tick) => Number.isInteger(tick)) as tick (tick)}
						<line
							x1={xScale(tick)}
							x2={xScale(tick)}
							y1={margin.top}
							y2={graphHeight - margin.bottom}
							stroke="black"
							stroke-width="0.5"
							stroke-dasharray="3,2"
							stroke-opacity="1"
						/>
					{/each}

					{#each yScale.ticks(5) as tick (tick)}
						<line
							x1={margin.left}
							x2={graphWidth - margin.right - margin.left}
							y1={yScale(tick)}
							y2={yScale(tick)}
							stroke="black"
							stroke-width="0.5"
							stroke-dasharray="3,2"
							stroke-opacity="1"
						/>
					{/each}
				</g>

				{#each groupedData as [islandName, islandData], i (islandName)}
					{@const islandColor = optionsState?.colorsIslands?.[islandName] || '#3b82f6'}

					<g class="island-group" data-island={islandName}>
						<path
							class="line-path"
							d={lineGenerator(islandData)}
							fill="none"
							stroke={islandColor}
							stroke-width="3"
							style="pointer-events: none;"
							use:animateLine={{ delay: i * 200 }}
						/>

						{#each islandData as dataPoint, pointIndex (`${islandName}-${dataPoint.TIME_PERIOD}-${pointIndex}`)}
							<circle
								class="data-point"
								cx={xScale(dataPoint.TIME_PERIOD)}
								cy={yScale(dataPoint.OBS_VALUE)}
								r="4"
								fill={islandColor}
								stroke="white"
								stroke-width="2"
								style="animation-delay: {1.5 + i * 0.2 + pointIndex * 0.1}s"
								onmouseenter={(e) => handleMouseEnter(e, dataPoint)}
								onmouseleave={handleMouseLeave}
								onclick={(e) => handleClick(e, dataPoint)}
							/>
						{/each}
					</g>
				{/each}

				<g class="x-axis" transform="translate(0, {graphHeight - margin.bottom})">
					{#each xScale.ticks(8).filter((tick) => Number.isInteger(tick)) as tick (tick)}
						<text
							x={xScale(tick)}
							y="20"
							text-anchor="middle"
							font-size="12"
							fill="#6b7280"
							font-weight="500"
						>
							{tick}
						</text>
					{/each}
				</g>

				<g class="y-axis" transform="translate({margin.left}, 0)">
					{#each yScale.ticks(5) as tick (tick)}
						<text
							x="-10"
							y={yScale(tick)}
							text-anchor="end"
							dominant-baseline="middle"
							font-size="12"
							fill="#6b7280"
							font-weight="500"
						>
							{tick}%
						</text>
					{/each}
				</g>
			</svg>
		</div>
	</div>

	{#if groupedData.length > 0 && optionsState?.colorsIslands}
		<div class="w-full max-w-4xl">
			<div
				class="rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50/30 p-6 shadow-sm"
			>
				<div class="mb-4 flex items-center gap-2">
					<svg class="size-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 5.447-2.724A1 1 0 0121 3.382v10.764a1 1 0 01-.553.894L15 18l-6-3z"
						/>
					</svg>
					<h3 class="text-base font-semibold text-gray-800">Islands</h3>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each groupedData as [islandName, islandData] (islandName)}
						<div
							class="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white/50 p-3 transition-all duration-200 hover:shadow-md hover:shadow-gray-100/50"
						>
							<div class="flex items-center">
								<svg width="32" height="16" class="mr-2">
									<defs>
										<linearGradient
											id="line-gradient-{islandName}"
											x1="0%"
											y1="0%"
											x2="100%"
											y2="0%"
										>
											<stop
												offset="0%"
												style="stop-color:{optionsState.colorsIslands[islandName]};stop-opacity:0.3"
											/>
											<stop
												offset="50%"
												style="stop-color:{optionsState.colorsIslands[islandName]};stop-opacity:1"
											/>
											<stop
												offset="100%"
												style="stop-color:{optionsState.colorsIslands[islandName]};stop-opacity:0.3"
											/>
										</linearGradient>
									</defs>
									<line
										x1="2"
										y1="8"
										x2="30"
										y2="8"
										stroke="url(#line-gradient-{islandName})"
										stroke-width="3"
									/>
									<circle
										cx="16"
										cy="8"
										r="4"
										fill={optionsState.colorsIslands[islandName]}
										stroke="white"
										stroke-width="2"
										class="drop-shadow-sm"
									/>
								</svg>
							</div>

							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between">
									<span class="truncate text-sm font-medium text-gray-900">{islandName}</span>
									<span
										class="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
									>
										{islandData.length}
										{islandData.length === 1 ? 'point' : 'points'}
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.island-group {
		transition: all 0.2s ease;
	}

	.island-group:hover .line-path {
		stroke-width: 4px;
	}

	.island-group:hover .data-point {
		r: 6;
	}

	.island-group:not(:hover) {
		opacity: 0.7;
	}

	svg:not(:hover) .island-group {
		opacity: 1;
	}

	.line-path {
		transition: stroke-width 0.2s ease;
	}

	.data-point {
		opacity: 0;
		animation: fadeInPoint 0.4s ease-out forwards;
		transition: r 0.2s ease;
		cursor: pointer;
	}

	@keyframes fadeInPoint {
		from {
			opacity: 0;
			transform: scale(0.3);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.grid {
		opacity: 0.5;
	}

	.x-axis,
	.y-axis {
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}
</style>
