<script lang="ts">
	import { scaleLinear } from 'd3';
	import { area, curveLinear, line } from 'd3';
	import { extent, max, min, group } from 'd3';

	import { translate } from '../../../../translate_util';

	import { appData } from '../../../../state.svelte';

	// Updated props destructuring following Svelte 5 best practices
	let { firstOptionsState, secondOptionsState } = $props();

	let selectedPoint = $state({});

	const getFilteredData = (optionsState) => {
		return appData.skills.filter(
			(d) =>
				optionsState.selectedIslands.includes(d.GEO_PICT) &&
				optionsState.selectedSkills.includes(d.COMPOSITE_BREAKDOWN) &&
				optionsState.selectedSexes.includes(d.SEX) &&
				optionsState.selectedEducation.includes(d.EDUCATION)
		);
	};

	// Using $derived.by for complex derivations following Svelte 5 patterns
	const firstFilteredData = $derived.by(() => getFilteredData(firstOptionsState));
	const secondFilteredData = $derived.by(() => getFilteredData(secondOptionsState));

	let graphWidth = $state(0);

	const firstGroupedData = $derived.by(() => {
		return Array.from(group(firstFilteredData, (d) => d.GEO_PICT));
	});

	const secondGroupedData = $derived.by(() => {
		return Array.from(group(secondFilteredData, (d) => d.GEO_PICT));
	});

	const margin = { top: 40, right: 40, left: 40, bottom: 50 };
	let computedGraphWidth = $derived(graphWidth - margin.right);
	const graphHeight = 400;

	// Combine all data to get proper scale domains
	const allData = $derived([...firstFilteredData, ...secondFilteredData]);

	let xScale = $derived(
		scaleLinear()
			.domain(extent(allData, (d) => d['TIME_PERIOD']))
			.range([margin.left + margin.right, computedGraphWidth])
	);

	let yScale = $derived(
		scaleLinear()
			.domain([0, 100])
			.range([graphHeight - margin.bottom, margin.top])
	);

	// D3 area generator - fills from 0 to value
	const generateAreaPath = (islandData, yField) => {
		return area()
			.x((d) => xScale(d['TIME_PERIOD']))
			.y0(yScale(0))
			.y1((d) => yScale(+d[yField]))
			.curve(curveLinear)(islandData);
	};

	// D3 line generator - creates only the upper border line
	const generateLinePath = (islandData, yField) => {
		return line()
			.x((d) => xScale(d['TIME_PERIOD']))
			.y((d) => yScale(+d[yField]))
			.curve(curveLinear)(islandData);
	};

	// Svelte 5 action for animating area paths
	function animateArea(node, { delay = 0, isSecondary = false } = {}) {
		// Set up the starting positions for fill
		node.style.fillOpacity = '0';

		// Animate after delay
		const timeout = setTimeout(() => {
			node.style.transition = 'fill-opacity 2s ease-in-out';
			node.style.fillOpacity = isSecondary ? '0.3' : '0.5';
		}, delay);

		return {
			destroy() {
				clearTimeout(timeout);
			}
		};
	}

	function animateLine(node, { delay = 0 } = {}) {
		const pathLength = node.getTotalLength();

		node.style.strokeDasharray = pathLength.toString();
		node.style.strokeDashoffset = pathLength.toString();

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

	// Event handlers following Svelte 5 syntax (removing on: prefix)
	const handleMouseEnter = (e, dataPoint, dataset) => {
		selectedPoint = {
			x: e.clientX,
			y: e.clientY,
			data: dataPoint,
			dataset
		};
	};

	const handleMouseOut = () => {
		selectedPoint = {};
	};
</script>

<div class="flex w-full flex-col items-center justify-center" bind:clientWidth={graphWidth}>
	<div class="flex w-full items-center justify-between p-10">
		<h2 class="font-semibold text-gray-600">Comparative Education Data by Island</h2>
		<div class="flex flex-col text-sm text-gray-500">
			<div class="flex items-center gap-2">
				<div class="h-2 w-4 rounded bg-blue-500 opacity-50"></div>
				<span
					>Dataset 1: {firstOptionsState.selectedIslands.length} island{firstOptionsState
						.selectedIslands.length !== 1
						? 's'
						: ''}</span
				>
			</div>
			<div class="flex items-center gap-2">
				<div class="h-2 w-4 rounded bg-red-500 opacity-30"></div>
				<span
					>Dataset 2: {secondOptionsState.selectedIslands.length} island{secondOptionsState
						.selectedIslands.length !== 1
						? 's'
						: ''}</span
				>
			</div>
		</div>
	</div>

	{#if selectedPoint.data}
		<div
			class="absolute z-10 flex flex-col rounded-xl border bg-white p-3 shadow-lg"
			style="top: {selectedPoint.y + 10}px; left: {selectedPoint.x > window.innerWidth / 2
				? selectedPoint.x - 120
				: selectedPoint.x + 10}px;"
		>
			<span class="font-semibold">{selectedPoint.data.GEO_PICT}</span>
			<span>{selectedPoint.data.OBS_VALUE}%</span>
			<span class="text-xs text-gray-500">{selectedPoint.dataset}</span>
		</div>
	{/if}

	<svg width={computedGraphWidth + margin.left} height={graphHeight}>
		<!-- X Axis -->
		<g transform="translate(0,{graphHeight - margin.bottom})">
			{#each xScale
				.ticks()
				.slice(1)
				.filter((tick) => Number.isInteger(tick)) as tick}
				as tick}
				<line
					stroke="#142e63"
					stroke-width="0.8"
					opacity="0.2"
					stroke-dasharray="4,6"
					x1={xScale(tick)}
					x2={xScale(tick)}
					y2={-graphHeight + margin.top + margin.bottom}
					y1={0}
				/>
			{/each}
			{#each xScale.ticks(5).filter((tick) => Number.isInteger(tick)) as tick}
				as tick}
				<text
					font-size="11px"
					fill="#6b7280"
					text-anchor="middle"
					x={xScale(tick) + 10}
					y={20 + 2}
					transform="rotate(90, {xScale(tick)}, 20)"
				>
					{tick}
				</text>
			{/each}
		</g>

		<!-- Y Axis -->
		<g transform="translate({margin.left}, 0)">
			{#each yScale.ticks(5) as tick}
				<line
					stroke="#142e63"
					stroke-width="0.8"
					stroke-opacity="0.2"
					stroke-dasharray="4,6"
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

		<!-- First Dataset Areas -->
		{#each firstGroupedData as [islandName, islandData], i}
			<g class="area-group first-dataset" data-island={islandName}>
				<!-- Area fill (no stroke) -->
				<path
					class="area-fill"
					d={generateAreaPath(islandData, 'OBS_VALUE')}
					fill="#3b82f6"
					fill-opacity="0"
					stroke="none"
					use:animateArea={{ delay: i * 200, isSecondary: false }}
				/>

				<!-- Upper border line only -->
				<path
					class="area-line"
					d={generateLinePath(islandData, 'OBS_VALUE')}
					fill="none"
					stroke="#3b82f6"
					stroke-width="2"
					use:animateLine={{ delay: i * 200 }}
				/>

				<!-- Data points with updated event handlers -->
				{#each islandData as dataPoint, pointIndex}
					<circle
						class="data-point first-dataset"
						cx={xScale(dataPoint['TIME_PERIOD'])}
						cy={yScale(dataPoint['OBS_VALUE'])}
						r="4"
						fill="#3b82f6"
						stroke="white"
						stroke-width="2"
						style="--point-index: {pointIndex}; --island-index: {i};"
						onmouseenter={(e) => handleMouseEnter(e, dataPoint, 'Dataset 1')}
						onmouseout={handleMouseOut}
					/>
				{/each}
			</g>
		{/each}

		<!-- Second Dataset Areas -->
		{#each secondGroupedData as [islandName, islandData], i}
			<g class="area-group second-dataset" data-island={islandName}>
				<!-- Area fill (no stroke) -->
				<path
					class="area-fill"
					d={generateAreaPath(islandData, 'OBS_VALUE')}
					fill="#ef4444"
					fill-opacity="0"
					stroke="none"
					use:animateArea={{ delay: i * 200 + 1000, isSecondary: true }}
				/>

				<!-- Upper border line only -->
				<path
					class="area-line"
					d={generateLinePath(islandData, 'OBS_VALUE')}
					fill="none"
					stroke="#ef4444"
					stroke-width="2"
					use:animateLine={{ delay: i * 200 + 1000 }}
				/>

				<!-- Data points with updated event handlers -->
				{#each islandData as dataPoint, pointIndex}
					<circle
						class="data-point second-dataset"
						cx={xScale(dataPoint['TIME_PERIOD'])}
						cy={yScale(dataPoint['OBS_VALUE'])}
						r="4"
						fill="#ef4444"
						stroke="white"
						stroke-width="2"
						style="--point-index: {pointIndex}; --island-index: {i};"
						onmouseenter={(e) => handleMouseEnter(e, dataPoint, 'Dataset 2')}
						onmouseout={handleMouseOut}
					/>
				{/each}
			</g>
		{/each}
	</svg>

	<!-- Legend -->
	<div class="mt-4 flex gap-6 text-sm">
		<div class="flex items-center gap-2">
			<div class="h-4 w-4 rounded bg-blue-500 opacity-50"></div>
			<span>Dataset 1</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="h-4 w-4 rounded bg-red-500 opacity-30"></div>
			<span>Dataset 2</span>
		</div>
	</div>
</div>

<style>
	.area-group:hover .area-fill {
		fill-opacity: 0.8 !important;
	}

	.area-group:hover .area-line {
		stroke-width: 3px;
	}

	.area-group:hover .data-point {
		r: 6;
	}

	.area-group:not(:hover) {
		opacity: 0.7;
	}

	svg:not(:hover) .area-group {
		opacity: 1;
	}

	.area-fill {
		transition-property: fill-opacity;
		transition-duration: 200ms;
		transition-timing-function: ease-in-out;
	}

	.area-line {
		transition-property: stroke-width;
		transition-duration: 200ms;
		transition-timing-function: ease-in-out;
	}

	.data-point {
		opacity: 0;
		animation: fadeInPoint 0.3s ease-out forwards;
		transition-property: r, opacity;
		transition-duration: 200ms;
		transition-timing-function: ease-in-out;
	}

	.first-dataset .data-point {
		animation-delay: calc(2s + var(--point-index, 0) * 0.1s + var(--island-index, 0) * 0.2s);
	}

	.second-dataset .data-point {
		animation-delay: calc(3s + var(--point-index, 0) * 0.1s + var(--island-index, 0) * 0.2s);
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
