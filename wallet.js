#!/usr/bin/env node

const ethers = require('ethers');
const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const prompt = require('prompt-sync')({ sigint: true });
const addressBookFilePath = path.join(__dirname, 'addressBook.json');
const walletAddressPath = path.join(__dirname, 'walletAddress.txt');
const walletKeyPath = path.join(__dirname, 'walletKey.json');
require('dotenv').config();

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);

// Ensures necessary files exist or creates them
const initFiles = () => {
    if (!fs.existsSync(walletAddressPath)) {
        fs.writeFileSync(walletAddressPath, '');
    }
    if (!fs.existsSync(walletKeyPath)) {
        fs.writeJsonSync(walletKeyPath, {});
    }
    if (!fs.existsSync(addressBookFilePath)) {
        fs.writeJsonSync(addressBookFilePath, {});
    }
};
initFiles();

// Utility function to derive a key from a password
const getKeyFromPassword = (password, salt) => crypto.scryptSync(password, salt, 32);

// Encrypts text using the provided password
const encryptText = (text, password) => {
    const salt = crypto.randomBytes(16);
    const key = getKeyFromPassword(password, salt);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        encryptedData: encrypted.toString('hex')
    };
};

// Decrypts text using the provided password
const decryptText = (hash, password) => {
    const key = getKeyFromPassword(password, Buffer.from(hash.salt, 'hex'));
    const iv = Buffer.from(hash.iv, 'hex');
    const encryptedText = Buffer.from(hash.encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = decipher.update(encryptedText) + decipher.final('utf8');
    return decrypted;
};
program
    .command('create')
    .description('Create a new Ethereum wallet')
    .action(() => {
        const password = prompt('Enter a password to encrypt your private key: ', { echo: '*' });
        const wallet = ethers.Wallet.createRandom();
        const encryptedPrivateKey = encryptText(wallet.privateKey, password);
        fs.writeJsonSync(walletKeyPath, encryptedPrivateKey);
        console.log(`Wallet created:\nAddress: ${wallet.address}\n(Note: The private key is encrypted.)`);

        // Save the "myself" alias with the new wallet address
        const addressBook = fs.readJsonSync(addressBookFilePath);
        addressBook['myself'] = wallet.address;
        fs.writeJsonSync(addressBookFilePath, addressBook);
        console.log('Alias "myself" has been set for your address.');
    });


program
    .command('get-address')
    .description('Retrieve the stored wallet address')
    .action(() => {
        const address = fs.readFileSync(walletAddressPath, 'utf8');
        console.log(`Wallet Address: ${address}`);
    });

program
    .command('get-private-key')
    .description('Decrypt and display the stored private key')
    .action(() => {
        const password = prompt('Enter your password to decrypt the private key: ', { echo: '*' });
        const encryptedData = fs.readJsonSync(walletKeyPath);
        try {
            const privateKey = decryptText(encryptedData, password);
            console.log(`Private Key: ${privateKey}`);
        } catch (error) {
            console.error('Failed to decrypt the private key. Please check your password.');
        }
    });

// Alias management
program
    .command('save-alias <alias> <address>')
    .description('Save an address with an alias')
    .action((alias, address) => {
        const addressBook = fs.readJsonSync(addressBookFilePath);
        addressBook[alias] = address;
        fs.writeJsonSync(addressBookFilePath, addressBook);
        console.log(`Address ${address} saved as ${alias}.`);
    });

program
    .command('send-to-alias <alias> <amount>')
    .description('Send ETH to a saved alias')
    .action(async (alias, amount) => {
        const walletData = fs.readJsonSync(walletFilePath);
        const addressBook = fs.readJsonSync(addressBookFilePath);
        const recipientAddress = addressBook[alias];
        if (!recipientAddress) {
            return console.error('Alias not found.');
        }
        await sendTransaction(walletData.privateKey, recipientAddress, amount);
    });

program
    .command('balance <address>')
    .description('Get the balance of an Ethereum address or an alias')
    .action(async (address) => {
        await getBalance({ address });
    });


program
    .command('send')
    .description('Send ETH to an address')
    .requiredOption('--to <address>', 'Recipient address')
    .requiredOption('--amount <amount>', 'Amount of ETH to send')
    .action(async (cmd) => {
        const password = prompt('Enter your password to decrypt your private key: ', { echo: '*' });
        let walletData;
        try {
            const encryptedWalletData = fs.readJsonSync(walletKeyPath);
            const privateKey = decryptText(encryptedWalletData, password);
            walletData = new ethers.Wallet(privateKey);
        } catch (error) {
            console.error('Failed to decrypt the private key. Please check your password.');
            return;
        }

        const senderWallet = walletData.connect(provider);
        const tx = {
            to: cmd.to,
            value: ethers.utils.parseEther(cmd.amount),
        };

        try {
            console.log(`Sending ${cmd.amount} ETH to ${cmd.to}...`);
            const transaction = await senderWallet.sendTransaction(tx);
            await transaction.wait();
            console.log(`Transaction successful! Hash: ${transaction.hash}`);
        } catch (error) {
            console.error(`Failed to send transaction: ${error.message}`);
        }
    });


program.parse();


async function getBalance(argv) {
    const addressBook = fs.readJsonSync(addressBookFilePath);
    // Check if the input is an alias and resolve to address; if not, use the input as the address
    const address = addressBook[argv.address] || argv.address;

    try {
        const balance = await provider.getBalance(address);
        console.log(`Balance of ${address} (${argv.address}): ${ethers.utils.formatEther(balance)} ETH`);
    } catch (error) {
        console.error('Failed to get balance:', error.message);
    }
}
