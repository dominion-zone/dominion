# Dominon SUI Contracts and TypeScript SDK

This repository contains a suite of smart contracts and tools designed for working with the SUI blockchain. It's structured to support comprehensive DAO operations, including asset management, proposal lifecycle, and governance integration. The repository is divided into smart contracts (sui) and a TypeScript (ts) folder containing SDKs and applications.

## Smart Contracts

### Dominion
The Core contract manages all assets under DAO control and implements the command protocol. This allows for precise command execution related to asset transfers and other governance actions.

### Dominion Governance
This contract oversees the proposal lifecycle and implements veToken mechanics, which are essential for managing voting rights and proposal validation within the DAO.

### Dominion Registry
The Registry contract plays a pivotal role by managing the registration of various governance instances, ensuring their visibility on the DAO's governance UI. Importantly, it enables the admin to set up payment requirements for inclusion in the registry. These funds are directed to the registry admin or, in the case of using the official app, to the developers. This mechanism not only supports financial sustainability but also allows for moderation of DAO names, preventing the use of inappropriate language on the main page of the app. This ensures a professional and respectful environment for all users.

### Test Coin
Designed for use on the testnet, this contract includes a coin that any user can mint. It serves as a tool for testing the governance processes without using real assets, providing a safe environment for development and experimentation.

## Understanding the Product Structure

For a visual representation of how these contracts interact and are structured within **Dominion**, please refer to the diagram available here: [Structure Diagram](./dominion-structure.png). This diagram provides a detailed overview of the contract architecture, helping you better understand the integral parts of the product.

## TypeScript Directory

### SDK
The `sdk` package provides wrappers for interacting with the blockchain, simplifying the integration of SUI functionalities into your applications.

### CLI
The `cli`  package offers a command-line interface for executing commands related to contract deployment and performing administrative tasks not yet implemented in the web app. Additionally, this package includes a crank bot, an automated tool that finalizes and executes proposals, ensuring seamless governance operations and timely execution of DAO activities.

### App
This folder contains a web interface built with React, TanStack Query, and TanStack Router. The app provides a user-friendly interface for managing DAO activities, including viewing proposals, voting, and asset tracking. Additionally, it facilitates the creation and setup of the DAO, allowing users to configure and launch their own decentralized organizations directly through the web interface.

## Getting Started

Before you begin, ensure you have installed `pnpm` for dependency management and `sui cli` for compiling and deploying contracts. Additionally, this project utilizes CouchDB to store configuration data.

### Setup and Build

After downloading the repository, you'll need to build the necessary TypeScript packages. Run the following commands to install dependencies and build each package:

```bash
pnpm install
cd ts/sdk
pnpm build
cd ../cli
pnpm build
cd ../app
pnpm build
```

### Configuration

The CLI interacts with CouchDB using the `COUCHDB_USER` and `COUCHDB_PASSWORD` environment variables for updating configurations during deployments and when creating the main registry. Adjust the `VITE_COUCHDB_URL` and `VITE_CONFIG_PATH` in the `.env` files to match your CouchDB settings.

Ensure you configure these variables according to your CouchDB installation to facilitate proper connection and operation.

## Contribution
Contributions to this project are welcome. Please submit your pull requests to the `main` branch.

## License
This project is licensed under the [BSD 2-Clause License](LICENSE). Please see the LICENSE file for more information.
