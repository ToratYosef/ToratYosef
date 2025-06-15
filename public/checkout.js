// This is your test secret API key.
const stripe = Stripe("pk_test_51RZEPeCMmspEQNuYXLdVBGpSSPewOBaH5d4eSIwrSDBeEsW9pBh7WAyDwFn8IzNyrYIY2SuV3pDXiNTmvJnr7YpC00JPzJh1lP");

initialize();

// Create a Checkout Session
async function initialize() {
  // --- NEW: Capture referral info (example: hardcoded or from URL) ---
  // In a real application, you might get this from:
  // - URL query parameter: const urlParams = new URLSearchParams(window.location.search); const referralCode = urlParams.get('ref');
  // - User input field
  const referralCode = "FRIEND_INVITE_XYZ"; // Example referral code

  const fetchClientSecret = async () => {
    const response = await fetch("/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referral: referralCode, // Send referral code to the server
      }),
    });
    const { clientSecret } = await response.json();
    return clientSecret;
  };

  const checkout = await stripe.initEmbeddedCheckout({
    fetchClientSecret,
  });

  // Mount Checkout
  checkout.mount('#checkout');
}