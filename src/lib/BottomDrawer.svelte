<script>
	import { Drawer, Button, CloseButton, A } from 'flowbite-svelte';
	import { InfoCircleSolid, ArrowRightOutline } from 'flowbite-svelte-icons';
	import { sineIn } from 'svelte/easing';
	import OptionsSelector from './OptionsSelector.svelte';
	import { appData } from '../state.svelte';

	let hidden8 = $state(true);
	let transitionParamsBottom = {
		y: 'auto',
		duration: 200,
		easing: sineIn
	};

	console.log(appData);
</script>

<div class="fixed bottom-[5dvh]">
	<Button class="rounded-4xl bg-blue-500 text-4xl" onclick={() => (hidden8 = false)}>🏝️</Button>
</div>

<Drawer
	placement="bottom"
	class="w-full p-0"
	transitionParams={transitionParamsBottom}
	bind:hidden={hidden8}
>
	<div class="flex w-full flex-col items-center justify-between">
		<OptionsSelector />
	</div>
</Drawer>
