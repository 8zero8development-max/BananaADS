import 'dotenv/config';
import { getUncachableStripeClient } from '../server/stripeClient';

async function seedProducts() {
  console.log('Seeding products to Stripe...');
  
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.list({ limit: 100 });
  const existingNames = existingProducts.data.map(p => p.name);

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small brands and creators - 5 Ad Campaigns/month',
      price: 2900,
      metadata: { tier: 'starter', campaigns: '5' }
    },
    {
      name: 'Professional',
      description: 'For growing businesses and agencies - Unlimited campaigns with voiceovers',
      price: 7900,
      metadata: { tier: 'professional', campaigns: 'unlimited' }
    },
    {
      name: 'Enterprise',
      description: 'For large teams and studios - Video generation, API access, and more',
      price: 19900,
      metadata: { tier: 'enterprise', campaigns: 'unlimited', video: 'true' }
    }
  ];

  for (const plan of plans) {
    if (existingNames.includes(plan.name)) {
      console.log(`Product "${plan.name}" already exists, skipping...`);
      continue;
    }

    console.log(`Creating product: ${plan.name}`);
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: plan.metadata,
    });

    console.log(`Creating price for ${plan.name}: $${plan.price / 100}/month`);
    await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
  }

  console.log('Done seeding products!');
}

seedProducts().catch(console.error);
