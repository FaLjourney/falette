// Encodes a rasterized wallpaper to PNG off the main thread (EXP-07). Workers cannot decode SVG, so
// the main thread sends an ImageBitmap of the drawn SVG.
import { cornerOpaque, PNG_TYPE } from './canvas';

export interface EncodeRequest {
	id: number;
	bitmap: ImageBitmap;
}

export type EncodeResponse = { id: number; blob: Blob } | { id: number; error: string };

addEventListener('message', async (event: MessageEvent<EncodeRequest>) => {
	const { id, bitmap } = event.data;
	const { width, height } = bitmap;
	const canvas = new OffscreenCanvas(width, height);
	let response: EncodeResponse;
	try {
		const context = canvas.getContext('2d');
		if (context === null) {
			throw new Error(`No canvas of ${width} × ${height} px`);
		}
		context.drawImage(bitmap, 0, 0);
		if (!cornerOpaque(context, width, height)) {
			throw new Error(`The canvas of ${width} × ${height} px stayed empty`);
		}
		response = { id, blob: await canvas.convertToBlob({ type: PNG_TYPE }) };
	} catch (error) {
		response = { id, error: error instanceof Error ? error.message : String(error) };
	} finally {
		bitmap.close();
		canvas.width = 0;
		canvas.height = 0;
	}
	postMessage(response);
});
