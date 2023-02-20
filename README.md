# Wallet API
## Wallet Implementation in NodeJs Environment 

The API is developed using Express framework, MongoDB and Ethereum with NodeJs environment.
- User can SignUp to the system to use the API.User wallet address and it's key is generated using etherjs and bip39.
- User can deposit, withdraw and  transfer the funds in the form of ERC20 tokens to the other users of the system.

***

### Features

- User session is maintained using JWT.
- Confirmation is send via Email on User signUp.
- User account is password protected.
- Transaction Confirmation is send via Email to the User
- Transaction is acheived using ERC20 contracts deployed on chain

***

### Tech

- Node.js
- Express
- Nodemailer
- Mongoose
- MongoDB
- Hardhat
- Solidity
- Etherjs

***

### Run the API
API requires installed Node.js to run.
Clone the Repo and Install the dependencies and devDependencies. Deploy the token contract using Hardhat environment and get the address of the deployed contract and add it to the environment variable. Start the server.

```sh
npm i
npm start
```
This API is not ready for the use in production.

***

### Available Endpoints
#### - (POST) ---  api/user/signUp
    parameters:  name, email,pass, confirmPass
#### - (POST) ---  api/user/verifyEmail
    parameters:  name, otp
#### - (POST) ---  api/user/getOtpForEmailConfirmation
    parameters:  email
#### - (POST) --- api/user/login
    parameters:  email, pass
#### - (GET) --- api/user/logout
#### - (POST) --- api/user/changepassword
    parameters:  email, currentPass, newPass ,confirmNewPass
#### - (POST) --- api/user/getResetPassOtpAndResetPassword
    parameters: (if target is "getResetPassOtp")[ email ]

    parameters: (if target is "resetPassword")[  email, target, passResetToken, pass, confirmPass]
   
#### - (POST) --- api/user/deposit
    parameters:  amount
#### - (POST) --- api/user/withdraw
    parameters:  amount
#### - (GET) --- api/user/getBalance
    parameters:  email
#### - (GET) --- api/user/getUser
    parameters:  email
#### - (POST) --- api/transaction/transfer
    parameters:  recepientEmail,amountToTransfer
#### - (GET) --- api/transaction/getTransactionDetails
#### - (GET) --- api/transaction/getTransactionDetail/:trxHash



