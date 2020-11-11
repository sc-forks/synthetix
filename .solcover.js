module.exports = {
	skipFiles: [
		'test-helpers',
		'EscrowChecker.sol',
	],
	mocha: {
		grep: '@cov-skip', // Find everything with this tag
		invert: true, // Run the grep's inverse set.
	},
	// Reduce instrumentation footprint - volume of solidity code
	// passed to compiler causes it to crash (See discussion PR #732)
	// Line and branch coverage will still be reported.
	measureStatementCoverage: false,
};
