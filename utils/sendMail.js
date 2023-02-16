// eslint-disable-next-line import/no-extraneous-dependencies
import NodeMailer from "nodemailer";
// eslint-disable-next-line import/newline-after-import
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

class EmailSender {
	transport;

	constructor(user) {
		this.to = user.email;
		this.from = process.env.FROM_EMAIL;
		this.transport = NodeMailer.createTransport({
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_SERVER_PORT,
			auth: {
				user: process.env.MAIL_USERNAME,
				pass: process.env.MAIL_PASSWORD,
			},
		});
	}

	async sendGreetingMessage() {
		const mailOptions = {
			from: this.from,
			to: this.to,
			subject: "Welcome to the Wallet",
			text: `Dear user,Congratulations! You have signed up for Wallet.`,
			html: `
            <h2>Dear user,
            <h3>Congratulations!</h3>
            <h4>You have signed up for Wallet and successfully verified your email. As a Reward your wallet is credited with 100 USD on ${new Date()}</h4>
            `,
		};
		await this.transport.sendMail(mailOptions);
	}

	async sendEmailVerification(otp) {
		const mailOptions = {
			from: this.from,
			to: this.to,
			subject: "Email Confirmation",
			text: `Dear user,Congratulations! You have signed up for Wallet. Kindly confirm your email to enjoy uninterrupted services`,
			html: `
            <h2>Dear user,
            <h3>Congratulations!</h3>
            <h4>You have signed up for Wallet
			Kindly confirm your email. Verification OTP : ${otp}  to get joining reward.
            `,
		};
		await this.transport.sendMail(mailOptions);
	}

	async sendPasswordResetToken(resetToken) {
		const mailOptions = {
			from: this.from,
			to: this.to,
			subject: "Password Reset Token",
			text: `This is the password reset token - ${resetToken}`,
			html: `
            <h2>Dear user
            <h4>As you have requested to reset password.Kindly get the password reset token below</h4>
           <br/>
           ${resetToken}
            `,
		};

		await this.transport.sendMail(mailOptions);
	}

	async sendTransactionConfirmation(trx, senderAddress, receiverAddress) {
		const mailOptions = {
			from: this.from,
			to: this.to,
			subject: "Transaction Confirmation Receipt",
			text: `Transaction was successful, From: ${trx.sender}(${senderAddress}) => To: ${trx.receiver}(${receiverAddress}), of Amount: ${trx.amount}, with transaction id of ${trx.id}`,
			html: `
            <h2>Dear user
            <h4>Transaction was successful, From: ${trx.sender}(${senderAddress}) => To: ${trx.receiver}(${receiverAddress}), of Amount: ${trx.amount}, with transaction id of ${trx.id}</h4>
           <br/>
           <h4>Use Polygonscan to expore details of transaction</h4>`,
		};

		await this.transport.sendMail(mailOptions);
	}
}

export default EmailSender;
