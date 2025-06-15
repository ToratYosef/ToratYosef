// This is your test secret API key.
const stripe = Stripe("pk_test_51RZEPeCMmspEQNuYXLdVBGpSSPewOBaH5d4eSIwrSDBeEsW9pBh7WAyDwFn8IzNyrYIY2SuV3pDXiNTmvJnr7YpC00JPzJh1lP");

initialize();

// Create a Checkout Session
async function initialize() {
  const fetchClientSecret = async () => {
    const response = await fetch("/create-checkout-session", {
      method: "POST",
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