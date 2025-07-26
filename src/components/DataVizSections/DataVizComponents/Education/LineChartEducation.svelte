<script lang="ts">
	import { scaleLinear } from 'd3';
	import { area, curveLinear, line } from 'd3';
	import { extent, max, min, group } from 'd3';
	import { appData } from '../../../../state.svelte';

	import { translate } from '../../../../translate_util';

	let { optionsState } = $props();

	let selectedPoint = $state({});

	const filteredData = $derived.by(() => {
		const filteredData = appData.skills.filter(
			(d) =>
				optionsState.selectedIslands.includes(d.GEO_PICT) &&
				optionsState.selectedSkills.includes(d.COMPOSITE_BREAKDOWN) &&
				optionsState.selectedSexes.includes(d.SEX) &&
				optionsState.selectedEducation.includes(d.EDUCATION)
		);
		return filteredData;
	});

	let graphWidth = $state(0);

	const groupedData = $derived.by(() => {
		return Array.from(group(filteredData, (d) => d.GEO_PICT));
	});

	// Reactive description data
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

	// Generate readable description text
	const descriptionText = $derived(() => {
		const { selectedSkills, selectedEducation, selectedSexes, selectedIslands } = optionsState;

		if (!descriptionData.hasData) {
			return 'No data available for the current selection. Please adjust your filters.';
		}

		const parts = [];

		// Subject description
		if (selectedSexes.length === 1) {
			parts.push(`${selectedSexes[0].toLowerCase()} individuals`);
		} else if (selectedSexes.length > 1) {
			parts.push(
				`individuals (${selectedSexes
					.map((sex) => translate(sex))
					.join(', ')
					.toLowerCase()})`
			);
		} else {
			parts.push('all individuals');
		}

		// Education level
		if (selectedEducation.length === 1) {
			parts.push(`with ${translate(selectedEducation[0]).toLowerCase()} education`);
		} else if (selectedEducation.length > 1) {
			parts.push(`across ${selectedEducation.length} education levels`);
		}

		// Skills
		if (selectedSkills.length === 1) {
			parts.push(`in ${translate(selectedSkills[0]).toLowerCase()}`);
		} else if (selectedSkills.length > 1) {
			parts.push(`across ${selectedSkills.length} skill categories`);
		}

		// Location
		if (selectedIslands.length === 1) {
			parts.push(`in ${selectedIslands[0]}`);
		} else if (selectedIslands.length > 1) {
			parts.push(`across ${selectedIslands.length} islands`);
		}

		const baseText = `Showing education data for ${parts.join(' ')}`;
		const statsText = ` over ${descriptionData.yearRange} (${descriptionData.totalDataPoints} data points, ${descriptionData.averageValue}% average)`;

		return baseText + statsText;
	});

	const margin = { top: 40, right: 40, left: 40, bottom: 50 };
	let computedGraphWidth = $derived(graphWidth - margin.right);
	const graphHeight = 400;

	let xScale = $derived(
		scaleLinear()
			.domain(extent(filteredData, (d) => d['TIME_PERIOD']))
			.range([margin.left * 2, graphWidth - margin.right])
	);

	let yScale = $derived(
		scaleLinear()
			.domain([0, 100])
			.range([graphHeight - margin.bottom, margin.top])
	);

	const generateLinePath = (islandData, yField) => {
		return line()
			.x((d) => xScale(d['TIME_PERIOD']))
			.y((d) => yScale(+d[yField]))
			.curve(curveLinear)(islandData);
	};

	// Create a unique key that changes when selection changes to trigger re-animation
	const animationKey = $derived(`${optionsState.selectedIslands.length}-${Date.now()}`);

	// Svelte action to animate path drawing with correct path length
	function animatePath(node, delay = 0) {
		const pathLength = node.getTotalLength();

		// Set up the starting positions with actual path length
		node.style.strokeDasharray = pathLength.toString();
		node.style.strokeDashoffset = pathLength.toString();

		// Animate after delay
		const timeout = setTimeout(() => {
			node.style.transition = 'stroke-dashoffset 2s ease-in-out';
			node.style.strokeDashoffset = '0';
		}, delay);

		return {
			destroy() {
				clearTimeout(timeout);
			}
		};
	}
</script>

<div
	class="flex w-full flex-col items-center justify-center space-y-6"
	bind:clientWidth={graphWidth}
>
	<!-- Header with dynamic title -->
	<div class="flex w-full items-start justify-between gap-4">
		<div class="flex-1">
			<h2 class="mb-2 text-xl font-bold text-gray-800">Education Data Visualization</h2>
			<p class="max-w-3xl text-sm leading-relaxed text-gray-600">
				{descriptionText()}
			</p>
		</div>
	</div>

	<!-- Filter summary chips -->
	<div class="flex w-full flex-wrap gap-2">
		{#if optionsState.selectedSkills.length > 0}
			<div
				class="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
			>
				<span class="h-2 w-2 rounded-full bg-blue-500"></span>
				Skills: {optionsState.selectedSkills.join(', ')}
			</div>
		{/if}

		{#if optionsState.selectedEducation.length > 0}
			<div
				class="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
			>
				<span class="h-2 w-2 rounded-full bg-green-500"></span>
				Education: {optionsState.selectedEducation.join(', ')}
			</div>
		{/if}

		{#if optionsState.selectedSexes.length > 0}
			<div
				class="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800"
			>
				<span class="h-2 w-2 rounded-full bg-purple-500"></span>
				Gender: {optionsState.selectedSexes.join(', ')}
			</div>
		{/if}
	</div>

	<!-- Tooltip -->
	{#if selectedPoint.data}
		<div
			class="pointer-events-none absolute z-10 flex flex-col rounded-xl border border-white/20 p-3 shadow-lg backdrop-blur-sm"
			style="background-color: {optionsState.colorsIslands[
				selectedPoint.data.GEO_PICT
			]}ee; top: {selectedPoint.y + 10}px; left: {selectedPoint.x > window.innerWidth / 2
				? selectedPoint.x - 120
				: selectedPoint.x + 10}px;"
		>
			<span class="text-sm font-semibold text-white">{selectedPoint.data.GEO_PICT}</span>
			<span class="text-xs text-white/90">Year: {selectedPoint.data.TIME_PERIOD}</span>
			<span class="font-medium text-white">{selectedPoint.data.OBS_VALUE}%</span>
		</div>
	{/if}

	<!-- Chart -->
	<div class="w-full">
		{#if !descriptionData.hasData}
			<div
				class="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
			>
				<div class="text-center">
					<div class="mb-2 text-gray-400">
						<svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							></path>
						</svg>
					</div>
					<p class="font-medium text-gray-600">No data to display</p>
					<p class="text-sm text-gray-500">Please select filters to view education data</p>
				</div>
			</div>
		{:else}
			<svg width={computedGraphWidth + margin.left} height={graphHeight} class="overflow-visible">
				<!-- X Axis -->
				<g transform="translate(0,{graphHeight - margin.bottom})">
					{#each xScale
						.ticks()
						.slice(1)
						.filter((tick) => Number.isInteger(tick)) as tick}
						<line
							stroke="#e5e7eb"
							opacity="0.8"
							stroke-dasharray="2,2"
							x1={xScale(tick)}
							x2={xScale(tick)}
							y2={-graphHeight + margin.top + margin.bottom}
							y1={0}
						/>
					{/each}
					{#each xScale.ticks(5).filter((tick) => Number.isInteger(tick)) as tick}
						<text
							font-size="11px"
							fill="#6b7280"
							text-anchor="middle"
							x={xScale(tick) + 10}
							y={28}
							transform="rotate(45, {xScale(tick)}, 20)"
						>
							{tick}
						</text>
					{/each}
				</g>

				<!-- Y Axis -->
				<g transform="translate({margin.left}, 0)">
					{#each yScale.ticks(5) as tick}
						<line
							stroke="#e5e7eb"
							opacity="0.8"
							stroke-dasharray="2,2"
							x1={margin.left}
							x2={computedGraphWidth - margin.right}
							y1={yScale(tick)}
							y2={yScale(tick)}
						/>

						<text
							fill="#6b7280"
							text-anchor="middle"
							font-size="11px"
							dominant-baseline="middle"
							x={-10}
							y={yScale(tick)}
							font-weight="600"
						>
							{tick}%
						</text>
					{/each}
				</g>

				{#each groupedData as [islandName, islandData], i}
					<g class="island-group" data-island={islandName}>
						<!-- Line path with staggered animation -->
						<path
							class="line-path"
							d={generateLinePath(islandData, 'OBS_VALUE')}
							fill="none"
							stroke={optionsState.colorsIslands[islandName]}
							stroke-width="3"
							style="--island-index: {i};"
						/>

						<!-- Data points with staggered animations -->
						{#each islandData as dataPoint, pointIndex}
							<circle
								class="data-point cursor-pointer"
								cx={xScale(dataPoint['TIME_PERIOD'])}
								cy={yScale(dataPoint['OBS_VALUE'])}
								r="4"
								fill={optionsState.colorsIslands[islandName]}
								stroke="white"
								stroke-width="2"
								style="--island-index: {i}; --point-index: {pointIndex};"
								onmouseenter={(e) => {
									selectedPoint = {
										x: e.clientX,
										y: e.clientY,
										data: dataPoint
									};
								}}
								onmouseout={() => {
									selectedPoint = {};
								}}
							/>
						{/each}
					</g>
				{/each}
			</svg>
		{/if}
	</div>
</div>

<style>
	.island-group:hover .line-path {
		opacity: 1;
		stroke-width: 4px;
	}

	.island-group:hover .data-point {
		r: 6;
	}

	/* Fade other islands when one is hovered */
	.island-group:not(:hover) {
		opacity: 0.6;
	}

	svg:not(:hover) .island-group {
		opacity: 1;
	}

	.line-path {
		opacity: 0.9;
		transition-property: opacity, stroke-width;
		transition-duration: 200ms;
		transition-timing-function: ease-in-out;
	}

	@keyframes drawLine {
		from {
			stroke-dashoffset: 1000;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	.data-point {
		opacity: 0;
		animation: fadeInPoint 0.3s ease-out forwards;
		transition-property: r, opacity;
		transition-duration: 200ms;
		transition-timing-function: ease-in-out;
	}

	@keyframes fadeInPoint {
		from {
			opacity: 0;
			transform: scale(0.5);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
