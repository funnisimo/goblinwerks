import pkg from './package.json';

export default [
	{
		input: 'src/index.js',
		output: [
			{
				name: 'GW',
				file: pkg.browser,
				format: 'umd',
				esModule: false,
			},  // browser-friendly UMD build
			{ file: pkg.main, format: 'cjs', esModule: false },	// CommonJS (for Node)
			{ file: pkg.module, format: 'es' }	// ES module (for bundlers)
		]
	}
];
