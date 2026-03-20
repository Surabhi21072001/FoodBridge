import { query } from '../config/database';
import bcrypt from 'bcrypt';

export const seedStudents = async () => {
  console.log('🎓 Seeding student users...');

  const students = [
    { email: 'alice.student@university.edu', password: 'password123', first_name: 'Alice', last_name: 'Student' },
    { email: 'bob.student@university.edu', password: 'password123', first_name: 'Bob', last_name: 'Student' },
  ];

  for (const s of students) {
    const hash = await bcrypt.hash(s.password, 10);
    await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'student', true, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, is_active = true`,
      [s.email, hash, s.first_name, s.last_name]
    );
    console.log(`  ✓ ${s.email}`);
  }

  console.log('✅ Student seed complete');
};

if (require.main === module) {
  seedStudents().then(() => process.exit(0)).catch(() => process.exit(1));
}
