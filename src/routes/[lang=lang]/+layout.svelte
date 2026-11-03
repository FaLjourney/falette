<script lang="ts">
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// The prerendered page already has the right <html lang>; this keeps it right after
	// navigating to another language in the browser (NAV-10).
	$effect(() => {
		document.documentElement.lang = data.lang;
	});
</script>

{@render children()}
