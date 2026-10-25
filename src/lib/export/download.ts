/** Safari cancels a download whose URL is revoked too soon. */
const REVOKE_DELAY_MS = 60_000;

/** Saves `blob` under `name` through a temporary download link. */
export function downloadFile(blob: Blob, name: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = name;
	document.body.append(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
