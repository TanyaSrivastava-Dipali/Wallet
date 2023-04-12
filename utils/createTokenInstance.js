import { ethers } from "ethers";
import ABI from "./tokenABI.js";

const createTokenContractInstance = (key,tokenContractAddress) => {
	const provider = new ethers.providers.JsonRpcProvider(process.env.MUMBAI_URL);
	const signer = new ethers.Wallet(key || process.env.ADMIN_PRIVATE_KEY, provider);
	const tokenContractInstance = new ethers.Contract(
		tokenContractAddress,
		ABI,
		provider
	);
	// const bal = await provider.getBalance(signer.address);
	// console.log("bal" ,bal.toNumber());
	return [tokenContractInstance, signer];
};

export default createTokenContractInstance;
