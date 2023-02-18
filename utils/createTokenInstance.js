// eslint-disable-next-line import/no-extraneous-dependencies
import { ethers } from "ethers";
// eslint-disable-next-line import/extensions
import ABI from "./tokenABI.js";

const createTokenContractInstance = () => {
	const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");
	const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
	const tokenContractInstance = new ethers.Contract(
		process.env.TOKEN_CONTRACT_ADDRESS,
		ABI,
		provider
	);
	return [tokenContractInstance, signer];
};

export default createTokenContractInstance;
