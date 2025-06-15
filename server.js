// This is your test secret API key.
const stripe = require('stripe')('sk_test_51RZEPeCMmspEQNuYocbevinHQf6Npcuwnq9wVKh667n4IucBHUZWPeAeBVYcRKZjutgHp1Gpy5uJ5oac9rmILnU700AaQSRTdJ');
const express = require('express');
const app = express();

// Firebase Admin SDK initialization
const admin = require('firebase-admin');
// IMPORTANT: Replace with the actual path to your downloaded Firebase service account JSON file
const serviceAccount = require('./torat-yose-firebase-adminsdk-fbsvc-b72c092c90.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // Initialize Firestore

const YOUR_DOMAIN = 'http://localhost:4242';

// Middleware to parse JSON body for /create-checkout-session
app.use(express.json()); // Use this for JSON bodies from checkout.js
app.use(express.static('public')); // Serve static files after json parsing if /create-checkout-session is also under /public

app.post('/create-checkout-session', async (req, res) => {
  // --- NEW: Get referral from request body ---
  const { referral } = req.body;

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: [
      {
        price: 'price_1RZETJCMmspEQNuYJ55xpK1k',
        quantity: 1,
      },
    ],
    mode: 'payment',
    return_url: `${YOUR_DOMAIN}/return.html?session_id={CHECKOUT_SESSION_ID}`,
    phone_number_collection: {
      enabled: true, // Enable phone number collection
    },
    // --- NEW: Add referral to metadata ---
    metadata: {
      referral_code: referral,
    },
  });

  res.send({clientSecret: session.client_secret});
});

app.get('/session-status', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

  res.send({
    status: session.status,
    customer_email: session.customer_details.email
  });
});

// Webhook endpoint
// Use raw body parser for Stripe webhook signature verification
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // IMPORTANT: Replace 'whsec_...' with your actual webhook secret from the Stripe Dashboard
    event = stripe.webhooks.constructEvent(req.body, sig, 'whsec_YOUR_WEBHOOK_SECRET');
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);

      // Extract buyer information
      const buyerInfo = {
        sessionId: session.id,
        email: session.customer_details ? session.customer_details.email : null,
        name: session.customer_details ? session.customer_details.name : null,
        phoneNumber: session.customer_details ? session.customer_details.phone : null,
        moneySpent: session.amount_total, // Amount in cents, convert to dollars if needed
        currency: session.currency,
        paymentStatus: session.payment_status,
        // --- NEW: Extract referral from metadata ---
        referral: session.metadata ? session.metadata.referral_code : null,
        // You can add more details from the session object as needed
      };

      try {
        // Send buyer information to Firestore
        await db.collection('buyers').add(buyerInfo);
        console.log('Buyer information saved to Firebase:', buyerInfo);
      } catch (firebaseError) {
        console.error('Error saving to Firebase:', firebaseError);
        return res.status(500).send('Firebase save error');
      }

      break;
    // Handle other event types if necessary
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
});


app.listen(4242, () => console.log('Running on port 4242'));