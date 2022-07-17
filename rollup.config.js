import { default as typescript } from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import { default as bundleSize } from 'rollup-plugin-bundle-size'
import { default as MagicString } from 'magic-string'

export default {
	input: 'src/dom-slot-assign.ts',
	output: [
		{
			file: 'dist/dom-slot-assign.js',
			format: 'esm',
			sourcemap: 'hidden',
			strict: false,
			plugins: [
				formatTabs(),
				trimTrailingSpace(),
				bundleSize(),
			]
		},
		{
			file: 'dist/dom-slot-assign.min.js',
			format: 'esm',
			sourcemap: 'hidden',
			strict: false,
			plugins: [
				terser(),
				trimTrailingSpace(),
				bundleSize(),
			]
		}
	],
	plugins: [
		typescript(),
	],
}

function formatTabs() {
	return {
		name: 'format-tabs',
		renderChunk(code) {
			const str = new MagicString(code)

			str.replace(/^ {4,}/gm, $0 => $0 % 4 ? $0 : '\t'.repeat($0.length / 4))

			return {
				code: str.toString(),
				map: str.generateMap({ hires: true }),
			}
		}
	};
}

function trimTrailingSpace() {
	return {
		name: 'trim-trailing-space',
		renderChunk(code) {
			const str = new MagicString(code)

			str.replace(/\s+$/g, '')

			return {
				code: str.toString(),
				map: str.generateMap({ hires: true }),
			}
		}
	};
}
