import { defineParams } from '@sveltejs/kit/params';
import { lang } from './lang.ts';

export const params = defineParams({ lang });
