<script lang="ts">
	import { scaleLinear } from 'd3';
	import { area, curveLinear, line } from 'd3';
	import { extent, max, min, group } from 'd3';

	import { appData } from '../../../../state.svelte';

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

<div class="flex w-full flex-col items-center justify-center" bind:clientWidth={graphWidth}>
	<div class="flex w-full items-center justify-between">
		<h2 class="font-gray-600 font-semibold">Education Data by Island</h2>
		<div class="text-sm text-gray-500">
			{optionsState.selectedIslands.length} island{optionsState.selectedIslands.length !== 1
				? 's'
				: ''} selected
		</div>
	</div>

	{#if selectedPoint.data}
		<div
			class="absolute flex flex-col rounded-xl p-3"
			style="background-color: {optionsState.colorsIslands[
				selectedPoint.data.GEO_PICT
			]}99; top: {selectedPoint.y + 10}px; left: {selectedPoint.x > window.innerWidth / 2
				? selectedPoint.x - 20
				: selectedPoint.x + 10}px;"
		>
			<span>{selectedPoint.data.GEO_PICT}</span>
			<span>{selectedPoint.data.OBS_VALUE}%</span>
		</div>
	{/if}

	<svg width={computedGraphWidth + margin.left} height={graphHeight}>
		<!-- X Axis -->
		<g transform="translate(0,{graphHeight - margin.bottom})">
			{#each xScale
				.ticks()
				.slice(1)
				.filter((tick) => Number.isInteger(tick)) as tick}
				<line
					stroke="blue"
					opacity="0.2"
					stroke-dasharray="5"
					x1={xScale(tick)}
					x2={xScale(tick)}
					y2={-graphHeight + margin.top + margin.bottom}
					y1={0}
				/>
			{/each}
			{#each xScale.ticks(5).filter((tick) => Number.isInteger(tick)) as tick}
				<text
					font-size="11px"
					fill="blue"
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
					stroke="blue"
					opacity="0.2"
					stroke-dasharray="5"
					x1={margin.left}
					x2={computedGraphWidth - margin.right}
					y1={yScale(tick)}
					y2={yScale(tick)}
				/>

				<text
					fill="blue"
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
						class="data-point"
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
							console.log($state.snapshot(selectedPoint));
						}}
						onmouseout={() => {
							selectedPoint = {};
							console.log($state.snapshot(selectedPoint));
						}}
					/>
				{/each}
			</g>
		{/each}
	</svg>
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
		opacity: 0.4;
	}

	svg:not(:hover) .island-group {
		opacity: 1;
	}

	.line-path {
		opacity: 0.9;
		/* Remove fixed stroke-dasharray - will be set by JavaScript */
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
