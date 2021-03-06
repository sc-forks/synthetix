const { connectContract } = require('./connectContract');
const { web3 } = require('hardhat');
const { toBN } = web3.utils;
const { toBytes32 } = require('../../..');

async function ensureAccountHasEther({ amount, account, fromAccount }) {
	const balance = toBN(await web3.eth.getBalance(fromAccount));
	if (balance.lt(amount)) {
		throw new Error(
			`Account ${fromAccount} only has ${balance} ETH and cannot transfer ${amount} ETH to ${account} `
		);
	}

	await web3.eth.sendTransaction({
		from: fromAccount,
		to: account,
		value: amount,
	});
}

async function ensureAccountHasSNX({ network, amount, account, fromAccount }) {
	const SNX = await connectContract({ network, contractName: 'ProxyERC20' });

	const balance = toBN(await SNX.balanceOf(fromAccount));
	if (balance.lt(amount)) {
		throw new Error(
			`Account ${fromAccount} only has ${balance} SNX and cannot transfer ${amount} SNX to ${account} `
		);
	}

	await SNX.transfer(account, amount, {
		from: fromAccount,
	});
}

async function ensureAccountHassUSD({ network, amount, account, fromAccount }) {
	const sUSD = await connectContract({ network, contractName: 'SynthsUSD', abiName: 'Synth' });
	const balance = toBN(await sUSD.transferableSynths(fromAccount));

	if (balance.lt(amount)) {
		const snxToTransfer = amount.mul(toBN('10'));
		await ensureAccountHasSNX({ network, account, amount: snxToTransfer, fromAccount });

		const Synthetix = await connectContract({
			network,
			contractName: 'ProxyERC20',
			abiName: 'Synthetix',
		});

		await Synthetix.issueSynths(amount, {
			from: account,
		});
	} else {
		await sUSD.transferAndSettle(account, amount, { from: fromAccount });
	}
}

async function ensureAccountHassETH({ network, amount, account, fromAccount }) {
	const sUSDAmount = amount.mul(toBN('10'));
	await ensureAccountHassUSD({ network, amount: sUSDAmount, account, fromAccount });

	const Synthetix = await connectContract({
		network,
		contractName: 'ProxyERC20',
		abiName: 'Synthetix',
	});

	await Synthetix.exchange(toBytes32('sUSD'), sUSDAmount, toBytes32('sETH'), {
		from: account,
	});
}

module.exports = {
	ensureAccountHasEther,
	ensureAccountHassUSD,
	ensureAccountHassETH,
	ensureAccountHasSNX,
};
