import React, { useEffect, useState, Fragment } from "react";
import ReactLoading from "react-loading";
import { ethers } from "ethers";
import { networks } from "./utils/networks";
import RandomPuppy from "./utils/RandomPuppy.json";
import Pug from "../src/img/pug.png";
import StBernard from "../src/img/st-bernard.png";
import ShibaInu from "../src/img/shiba-inu.png";
import polygonLogo from "./assets/polygonlogo.png";
import ethLogo from "./assets/ethlogo.png";
import "./App.css";

// Constants
const CONTRACT_ADDRESS = "0xAac6b1DFab73f408eE66cE27fa630E1e170C3B33";

function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [network, setNetwork] = useState("");
  const [loading, setLoading] = useState(false);

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Please get MetaMask!");
      return;
    } else {
      console.log("We have the Ethereum object");
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      setCurrentAccount(account);
      console.log("Found an authorized account:", account);
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }

    const chainId = await ethereum.request({ method: "eth_chainId" });
    setNetwork(networks[chainId]);

    // reload on network change
    ethereum.on("chainChanged", handleChainChanged);
    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  const connectWallet = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert("Please install MetaMask!");
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    const account = accounts[0];
    setCurrentAccount(account);
    console.log("Connect with account:", account);
    setupEventListener();
  };

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          RandomPuppy.abi,
          signer
        );

        // This will essentially "capture" our event when our contract throws it.
        connectedContract.on("PuppyMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `Hey there 🙂  We've minted your puppy NFT and sent it to your wallet! Here's the OpenSea link: https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const switchNetwork = async () => {
    const { ethereum } = window;
    if (ethereum) {
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13881" }],
        });
      } catch (error) {
        // if user doesn't have the Polygon tesnet added to their networks - we'll add it!
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x13881",
                  chainName: "Polygon Mumbai Testnet",
                  rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
                  nativeCurrency: {
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const spinLoading = () => (
    <ReactLoading type="spin" color="#fff" height={"5%"} width={"5%"} />
  );

  const mintPuppy = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        RandomPuppy.abi,
        signer
      );
      setLoading(true);
      let tx = await contract.requestPuppy();
      console.log("Mining ...");
      const receipt = await tx.wait();
      console.log("Mined", tx.hash);
      setLoading(false);

      if (receipt.status === 1) {
        console.log(
          `Domain minted! https://mumbai.polygonscan.com/tx/${tx.hash}`
        );
      } else {
        alert("Transaction Failed 🙁  Please try again!");
      }
    }
  };

  // Render Methods
  const renderUiNotConnected = () => (
    <Fragment>
      <p className="wallet-address">No Connected Account</p>
      <button onClick={connectWallet} className="button-74">
        Connect Wallet
      </button>
    </Fragment>
  );

  const renderUiConnected = () => {
    if (network !== "Polygon Mumbai Testnet") {
      return (
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "16px", fontStyle: "italic" }}>
            Please switch to the Polygon Mumbai Testnet!
          </h3>
          <button
            onClick={switchNetwork}
            style={{ margin: "20px 0" }}
            className="button-74"
          >
            Switch Network
          </button>
        </div>
      );
    }
    return (
      <Fragment>
        <div className="wallet-address">
          <img
            alt="Network logo"
            className="logo"
            src={network.includes("Polygon") ? polygonLogo : ethLogo}
          />
          <p>
            {" "}
            Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}{" "}
          </p>
        </div>
        {loading ? (
          spinLoading()
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <button
              style={{ margin: "10px" }}
              onClick={mintPuppy}
              className="button-74"
            >
              Mint NFT
            </button>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://testnets.opensea.io/collection/random-puppy-v4"
            >
              <button style={{ margin: "10px" }} className="button-74">
                🌊 View Collection on OpenSea
              </button>
            </a>
          </div>
        )}
      </Fragment>
    );
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  });

  return (
    <div className="App">
      <div className="header-info">
        <h1 className="title">Random Puppy NFTs</h1>
        <h4 className="sub-title">
          Adopt a random puppy on the Polygon Mumbai Testnet!
        </h4>
      </div>
      <div className="puppies">
        <div className="puppy">
          <img className="puppy-img" src={Pug} alt="Pug Puppy" />
          <p className="chance">10% chance of getting a Pug!</p>
        </div>
        <div className="puppy">
          <img className="puppy-img" src={ShibaInu} alt="Shiba Inu Puppy" />
          <p className="chance">20% chance of getting a Shiba Inu!</p>
        </div>
        <div className="puppy">
          <img className="puppy-img" src={StBernard} alt="St. Bernard Puppy" />
          <p className="chance">70% chance of getting a St. Bernard!</p>
        </div>
      </div>
      {currentAccount ? renderUiConnected() : renderUiNotConnected()}
    </div>
  );
}

export default App;
