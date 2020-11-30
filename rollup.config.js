import pkg from './package.json';

import resolve from '@rollup/plugin-node-resolve';

export default [
	{
		input: 'src/index.js',
		output: [
			{
				name: 'GW',
				file: pkg.browser,
				format: 'umd',
				esModule: false,
        freeze: false,
        extend: true,
			},  // browser-friendly UMD build
			{ file: pkg.main, format: 'cjs', esModule: false, freeze: false },	// CommonJS (for Node)
			{ file: pkg.module, format: 'es', freeze: false }	// ES module (for bundlers)
		],
    plugins: [ resolve() ]
	}
];
