import { createFileRoute } from "@tanstack/react-router";
import Header from "../components/Header";
import { Container } from "@mui/material";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <Header />
      <Container>
        <p>
          Introducing <strong>Dominion</strong>, a tool on the{" "}
          <strong>SUI Blockchain</strong> that empowers your DAO to function
          like a comprehensive wallet, managing all assets owned by the DAO,
          much like a personal wallet manages all your tokens and digital
          assets. This platform enables seamless governance of these assets,
          including tokens, NFTs, and contract upgrade rights.
        </p>
        <h3 id="comprehensive-asset-management">
          Comprehensive Asset Management
        </h3>
        <p>
          <strong>Dominion</strong> allows your DAO to hold and manage its
          complete portfolio of assets securely and efficiently. Whether it’s
          tokens, NFTs, or contract rights, each asset is integrated into the
          DAO’s operations, facilitating easy access and control, akin to
          managing assets in a personal digital wallet.
        </p>
        <h3 id="making-proposals">Making Proposals</h3>
        <p>
          Want to upgrade a smart contract or transfer tokens? Create a proposal
          using {" "}<strong>Dominion</strong> by detailing the contract upgrade or
          specifying the tokens and the recipient. Submit your proposal for
          community review with just a few clicks.
        </p>
        <h3 id="voting-on-proposals">Voting on Proposals</h3>
        <p>
          Stay engaged with your DAO’s activities by subscribing to
          notifications for new proposals and their execution. When a new
          proposal is submitted, such as a contract upgrade, you can review the
          details and use your voting power based on locked tokens, NFT
          ownership, or customized mechanisms to influence the decision.
        </p>
        <h3 id="executing-proposals">Executing Proposals</h3>
        <p>
          Once a proposal achieves the necessary consensus, it is automatically
          executed by {" "}<strong>Dominion</strong>, ensuring that actions like
          contract upgrades are carried out efficiently and transparently,
          reflecting the community’s collective decision.
        </p>
        <h3 id="sending-assets-to-the-dao">Sending Assets to the DAO</h3>
        <p>
          To add a new type of asset to the DAO’s governance, simply send it to
          the DAO’s wallet address using any
          {" "}<strong>SUI wallet</strong>. The administrator can configure
          {" "}<strong>Dominion</strong> to manage this new asset type, even if it
          was sent before the DAO was configured to support it, ensuring that
          all assets are effectively integrated and managed.
        </p>
        <h3 id="configuring-the-dao">Configuring the DAO</h3>
        <p>
          Tailor the governance of your DAO to match your communit’s vision and
          preferences. As an administrator, use
          {" "}<strong>Dominion</strong> to configure voting rules and asset
          management settings, enabling a governance structure that supports
          fair and active participation.
        </p>
        <h3 id="advanced-dao-configuration-with-extensible-plugins">
          Advanced DAO Configuration with Extensible Plugins
        </h3>
        <p>
          <strong>Dominion</strong> is proud to be the first DAO tool on the
          {" "}<strong>SUI Blockchain</strong> capable of managing any type of asset
          using an extensible plugins system. This innovative feature allows for
          unparalleled adaptability and customization, enabling your DAO to
          tailor its asset management and governance processes to meet specific
          needs and preferences, setting a new standard for decentralized
          governance solutions.
        </p>
      </Container>
    </>
  );
}
