import {
  MediaRenderer,
  useNetwork,
  useNetworkMismatch,
  useListing,
  useContract,
  useDirectListing,
  useEnglishAuction,
} from "@thirdweb-dev/react";
import {
  ChainId,
  ListingType,
  Marketplace,
  NATIVE_TOKENS,
} from "@thirdweb-dev/sdk";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { marketplaceContractAddress } from "../../addresses";
import styles from "../../styles/Home.module.css";

const ListingPage: NextPage = () => {
  // Next JS Router hook to redirect to other pages and to grab the query from the URL (listingId)
  const router = useRouter();

  // De-construct listingId out of the router.query.
  // This means that if the user visits /listing/0 then the listingId will be 0.
  // If the user visits /listing/1 then the listingId will be 1.
  const { listingId } = router.query as { listingId: string };

  // Hooks to detect user is on the right network and switch them if they are not
  const networkMismatch = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();

  // Initialize the marketplace contract
  const { contract: marketplace } = useContract(marketplaceContractAddress,'marketplace-v3');
  console.log(marketplace)

  // Fetch the listing from the marketplace contract
  const { data: listing, isLoading: loadingListing } = useDirectListing(
    marketplace,
    listingId
  );
  
  const { data: listingAuction, isLoading: loadingAuctionListing } = useEnglishAuction(
    marketplace,
    listingId
  );



  console.log("MarketplaceV3 contract: ",marketplace)

  console.log("Listing id ",listingId)
  console.log("Listing: ",listing)

  // Store the bid amount the user entered into the bidding textbox
  const [bidAmount, setBidAmount] = useState<string>("");

  if (loadingListing) {
    return <div className={styles.loadingOrError}>Loading...</div>;
  }

  if (!listing) {
    return <div className={styles.loadingOrError}>Listing not found</div>;
  }

  async function createBidOrOffer() {
    try {
      console.log("Listing creator address: ",listing?.creatorAddress)
      // Ensure the user is on the correct network
      if (networkMismatch) {
        switchNetwork && switchNetwork(ChainId.Goerli);
        return;
      }

      // Ensure that bidAmount is not empty or invalid
  
      if (listing) {
        // Create an offer using functions specific to your contract version
        // Make sure to provide the correct parameters
        const result = await marketplace?.offers.makeOffer({
          assetContractAddress: listing.assetContractAddress, // Required - the contract address of the NFT to offer on
          tokenId: listingId, // Required - the token ID to offer on
          totalPrice: bidAmount, // Required - the price to offer in the currency specified
          // currencyContractAddress: NATIVE_TOKENS[ChainId.Goerli].wrapped.address, // Optional - defaults to the native wrapped currency
          // endTimestamp: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10), // Optional - Defaults to 10 years from now
          quantity: 1, 
         });

        if (result) {
          alert("Offer created successfully!");
          // Optionally, update the component's state or UI to reflect the offer creation.
        }
      } else if (listingAuction) {
        // Create a bid using functions specific to your contract version
        // Make sure to provide the correct parameters
        const result = await marketplace?.englishAuctions.makeBid(listingId,bidAmount);

        if (result) {
          alert("Bid created successfully!");
          // Optionally, update the component's state or UI to reflect the bid creation.
        }
      } else {
        alert("Listing not found");
      }
    } catch (error) {
      console.error(error);
      alert(error);
    }
  }

  async function buyNft() {
    try {
      // Ensure user is on the correct network
      if (networkMismatch) {
        switchNetwork && switchNetwork(ChainId.Goerli);
        return;
      }
       await marketplace?.directListings.buyFromListing(listingId, 1);
      alert("NFT bought successfully!");
    } catch (error) {
      console.error(error);
      alert(error);
    }
  }

  return (
    <div className={styles.container} style={{}}>
      <div className={styles.listingContainer}>
        <div className={styles.leftListing}>
          <MediaRenderer
            src={listing.asset.image}
            className={styles.mainNftImage}
          />
        </div>

        <div className={styles.rightListing}>
          <h1>{listing.asset.name}</h1>
          <p>
            Owned by {listing.creatorAddress}
            {/* <b>
              {listing.sellerAddress?.slice(0, 6) +
                "..." +
                listing.sellerAddress?.slice(36, 40)}
            </b> */}
          </p>

          {/* <h2>
            <b>{listing.buyoutCurrencyValuePerToken.displayValue}</b>{" "}
            {listing.buyoutCurrencyValuePerToken.symbol}
          </h2> */}

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 20,
              alignItems: "center",
            }}
          >
            <button
              style={{ borderStyle: "none" }}
              className={styles.mainButton}
              onClick={buyNft}
            >
              Buy
            </button>
            <p style={{ color: "grey" }}>|</p>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="text"
                name="bidAmount"
                className={styles.textInput}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Amount"
                style={{ marginTop: 0, marginLeft: 0, width: 128 }}
              />
              <button
                className={styles.mainButton}
                onClick={createBidOrOffer}
                style={{
                  borderStyle: "none",
                  background: "transparent",
                  width: "fit-content",
                }}
              >
                Make Offer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingPage;
