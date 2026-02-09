// Widget 3: ENS Profile Card
// dataCode — runs in isolated V8 sandbox
// Uses ENS public subgraph + metadata API (no key needed)

const main = async (jsParams) => {
  console.log("Starting ENS profile with params:", jsParams);

  const ensName = jsParams.ens_name || "";

  let result = {
    name: ensName || "No ENS Name",
    avatar: "",
    description: "",
    twitter: "",
    github: "",
    url: "",
    address: "",
    displayAddr: "",
    registrationDate: "",
    expiryDate: "",
    error: true,
    errorMsg: ""
  };

  if (!ensName || !ensName.includes(".")) {
    result.errorMsg = "Invalid ENS name";
    return result;
  }

  try {
    // 1. Resolve ENS name to address via public resolver
    console.log("Resolving ENS name:", ensName);

    // Use ENS metadata API (public, no key)
    const metaUrl = `https://metadata.ens.domains/mainnet/avatar/${ensName}`;
    const profileUrl = `https://enstate.rs/n/${ensName}`;
    console.log("Fetching profile from:", profileUrl);

    const profileResp = await fetch(profileUrl);
    if (profileResp && profileResp.ok) {
      const profile = await profileResp.json();
      console.log("Profile response:", JSON.stringify(profile));

      if (profile) {
        result.name = profile.name || ensName;
        result.avatar = profile.avatar || "";
        result.description = profile.records?.description || profile.description || "";
        result.twitter = profile.records?.["com.twitter"] || profile.twitter || "";
        result.github = profile.records?.["com.github"] || profile.github || "";
        result.url = profile.records?.url || profile.url || "";
        result.address = profile.address || "";
        result.displayAddr = profile.address
          ? `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`
          : "";
        result.error = false;
      }
    } else {
      console.error("ENS profile fetch failed:", profileResp?.status);
      // Fallback: try direct resolution
      result.errorMsg = "Could not resolve ENS name";
    }

    console.log("ENS profile processed successfully");

  } catch (e) {
    console.error("Widget execution failed:", e);
    result.errorMsg = "Failed to fetch ENS data";
  }

  return result;
};

main;
