
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {


  await prisma.products.createMany({
    data: [
      {
        productId: 'prod_QSkslDcBhj8y2Z',
        name: 'Basic Plan',
      },
      {
        productId: 'prod_QSktVsKo34GHYN',
        name: 'Pro Plan',
      },
    ],
  });

  // fetch the created products to get their IDs
  const products = await prisma.products.findMany({
    where: {
      productId: { in: ['prod_QSkslDcBhj8y2Z', 'prod_QSktVsKo34GHYN'] },
    },
  });

  const productIdMap = products.reduce((map, product) => {
    map[product.productId] = product.id;
    return map;
  }, {});

  // create prices next
  await prisma.prices.createMany({
    data: [
      {
        priceId: 'price_1PbpgJKWfbR45IR7mYwUUMT9',
        unitAmount: 10,
        currency: 'usd',
        productId: productIdMap['prod_QSkslDcBhj8y2Z'],
        intervalCount: 1,
        pricingPlanInterval: 'month',
        pricingType: 'recurring',
        type: 'basic',
      },
      {
        priceId: 'price_1PbprLKWfbR45IR7HCZf44op',
        unitAmount: 100,
        currency: 'usd',
        productId: productIdMap['prod_QSktVsKo34GHYN'],
        intervalCount: 1,
        pricingPlanInterval: 'year',
        pricingType: 'recurring',
        type: 'basic',
      },
      {
        priceId: 'price_1PbPqgKWfbR45IR7L4V0Y7RL',
        unitAmount: 20,
        currency: 'usd',
        productId: productIdMap['prod_QSktvsKo34GHYN'],
        intervalCount: 1,
        pricingPlanInterval: 'month',
        pricingType: 'recurring',
        type: 'pro',
      },
      {
        priceId: 'price_1PbpQVlWfbR45IR7TBywWkkO',
        unitAmount: 200,
        currency: 'usd',
        productId: productIdMap['prod_QSktVsKo34GHYN'],
        intervalCount: 1,
        pricingPlanInterval: 'year',
        pricingType: 'recurring',
        type: 'pro',
      },
    ],
  });
}

// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });