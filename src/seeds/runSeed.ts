import dotenv from 'dotenv';
dotenv.config();

import { seedListings } from './seedListings';

(async () => {
  try {
    await seedListings();
    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();
