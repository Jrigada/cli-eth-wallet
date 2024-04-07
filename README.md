# CLI Ethereum Wallet

A simple Command Line Interface (CLI) Ethereum wallet for securely managing Ethereum transactions. This wallet supports creating wallets, checking balances, sending ETH, and managing address aliases, with flexibility across Ethereum networks.

## Prerequisites

- Node.js (v14.0 or later recommended). Download and install from [Node.js official website](https://nodejs.org/).

## Installation

1. **Clone the Repository**

   Clone this repository to your local machine:

## Install dependencies

1. **Install the required npm packages**

   ```bash 
   npm install
   ```

2. **Link for Global Use**

    Make the ethwallet command available globally on your system:

    ```bash
    npm link
    ```
    This allows you to use the ethwallet command from any directory in your terminal.

## Configuration

1. **Set up .env File**

    Create a .env file in the root of the project directory. Specify your Ethereum network JSON RPC provider URL. For example, to connect to the Ethereum mainnet via Infura:

    ```
    INFURA_PROJECT_ID=your_infura_project_id_here
    RPC_PROVIDER_URL=https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}
    ```
    Or, for a local Ethereum node:
    ```
    RPC_PROVIDER_URL=http://localhost:8545
    ```

2. **Environment Variables**

    Ensure the dotenv package is installed to load the .env configuration. This step should be covered if you've followed the installation instructions and run npm install.

## Usage
After linking the project with npm link, you can use the ethwallet command followed by specific operations:

### Creating a Wallet
Create a new Ethereum wallet. This will also set up an alias "myself" for your new wallet:
```bash
ethwallet create
```

### Setting an Alias
```bash
ethwallet save-alias <alias> <address>
```

### Checking Balance
```bash
ethwallet balance <address or alias>
```

### Sending Ethereum (ETH)
The send command allows you to securely send ETH to another Ethereum address. The command prompts you for a password to decrypt your stored private key, ensuring your transaction is signed without directly exposing your private key.

Usage
To send ETH, use the following command structure:

```bash
ethwallet send --to <recipientAddress> --amount <amount>
```

After executing the command, you'll be prompted to enter the password you used to encrypt your private key. Once the correct password is provided, the transaction will be processed.

## Security Considerations
This wallet stores the private key in an encrypted format. However, it's crucial to keep the .env file, the encrypted key file, and the password secure. Avoid sharing your private key and password.

## Contributing
Contributions to this project are welcome! Please fork the repository and submit a pull request with your enhancements.

## License
This project is licensed under the MIT License.