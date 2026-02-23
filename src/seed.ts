import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Seed script to populate the database with sample data for testing.
 * Run with: npx ts-node src/seed.ts
 *
 * Creates:
 * - 1 Admin user
 * - 1 VIP user
 * - 1 Normal user
 * - 2 Contests (1 normal, 1 VIP)
 * - Questions for each contest
 */
async function seed() {
  // Connect directly to the database (same config as the app)
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'contest_db',
    synchronize: true,
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
  });

  await dataSource.initialize();
  console.log('📦 Database connected. Seeding...');

  const queryRunner = dataSource.createQueryRunner();

  try {
    // Hash a common password for all seed users
    const passwordHash = await bcrypt.hash('password123', 10);

    // --- Create users ---
    console.log('👤 Creating users...');

    const adminResult = await queryRunner.query(
      `INSERT INTO users (username, email, "passwordHash", role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      ['admin', 'admin@example.com', passwordHash, 'admin'],
    );

    const vipResult = await queryRunner.query(
      `INSERT INTO users (username, email, "passwordHash", role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      ['vip_user', 'vip@example.com', passwordHash, 'vip'],
    );

    const userResult = await queryRunner.query(
      `INSERT INTO users (username, email, "passwordHash", role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      ['normal_user', 'user@example.com', passwordHash, 'user'],
    );

    console.log('✅ Users created (admin, vip_user, normal_user)');
    console.log('   Password for all: password123');

    // --- Create a normal contest (past start time so users can join right away) ---
    console.log('\n🏆 Creating contests...');

    const normalContestResult = await queryRunner.query(
      `INSERT INTO contests (name, description, "accessLevel", "startTime", "endTime", "prizeInfo", "isActive")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        'JavaScript Fundamentals Quiz',
        'Test your knowledge of JavaScript basics! 10 questions covering variables, functions, and more.',
        'normal',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // started yesterday
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // ends next week
        '$100 Amazon Gift Card',
        true,
      ],
    );
    const normalContestId = normalContestResult[0].id;

    const vipContestResult = await queryRunner.query(
      `INSERT INTO contests (name, description, "accessLevel", "startTime", "endTime", "prizeInfo", "isActive")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        'Advanced TypeScript Challenge',
        'VIP-exclusive challenge on advanced TypeScript patterns, generics, and type gymnastics.',
        'vip',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        '$500 Udemy Course Bundle',
        true,
      ],
    );
    const vipContestId = vipContestResult[0].id;

    console.log('✅ Created 2 contests (Normal + VIP)');

    // --- Add questions to the normal contest ---
    console.log('\n❓ Adding questions...');

    const normalQuestions = [
      {
        text: 'What is the output of typeof null?',
        type: 'single_select',
        options: ['null', 'undefined', 'object', 'number'],
        correct: ['object'],
        points: 10,
      },
      {
        text: 'Which of the following are falsy values in JavaScript?',
        type: 'multi_select',
        options: ['0', '""', 'null', '"false"', 'undefined'],
        correct: ['0', '""', 'null', 'undefined'],
        points: 15,
      },
      {
        text: 'JavaScript is a single-threaded language.',
        type: 'true_false',
        options: ['True', 'False'],
        correct: ['True'],
        points: 5,
      },
      {
        text: 'What does the === operator do?',
        type: 'single_select',
        options: [
          'Assigns a value',
          'Compares values only',
          'Compares values and types',
          'None of the above',
        ],
        correct: ['Compares values and types'],
        points: 10,
      },
      {
        text: 'Which methods can be used to create a shallow copy of an array?',
        type: 'multi_select',
        options: ['slice()', 'splice()', 'spread operator (...)', 'concat()'],
        correct: ['slice()', 'spread operator (...)', 'concat()'],
        points: 15,
      },
    ];

    for (let i = 0; i < normalQuestions.length; i++) {
      const q = normalQuestions[i];
      await queryRunner.query(
        `INSERT INTO questions ("contestId", "questionText", type, options, "correctAnswers", points, "orderIndex")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          normalContestId,
          q.text,
          q.type,
          JSON.stringify(q.options),
          JSON.stringify(q.correct),
          q.points,
          i + 1,
        ],
      );
    }

    // --- Add questions to the VIP contest ---
    const vipQuestions = [
      {
        text: 'What is a conditional type in TypeScript?',
        type: 'single_select',
        options: [
          'A type that depends on a condition',
          'A type that is always true',
          'A runtime type check',
          'A type alias',
        ],
        correct: ['A type that depends on a condition'],
        points: 10,
      },
      {
        text: 'TypeScript supports generic constraints.',
        type: 'true_false',
        options: ['True', 'False'],
        correct: ['True'],
        points: 5,
      },
      {
        text: 'Which of the following are utility types in TypeScript?',
        type: 'multi_select',
        options: ['Partial', 'Required', 'Readonly', 'Mutable'],
        correct: ['Partial', 'Required', 'Readonly'],
        points: 15,
      },
    ];

    for (let i = 0; i < vipQuestions.length; i++) {
      const q = vipQuestions[i];
      await queryRunner.query(
        `INSERT INTO questions ("contestId", "questionText", type, options, "correctAnswers", points, "orderIndex")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          vipContestId,
          q.text,
          q.type,
          JSON.stringify(q.options),
          JSON.stringify(q.correct),
          q.points,
          i + 1,
        ],
      );
    }

    console.log('✅ Added 5 questions to Normal contest, 3 to VIP contest');

    console.log('\n🎉 Seeding complete! You can now:');
    console.log('   1. Login as admin/vip_user/normal_user with password: password123');
    console.log('   2. Browse contests at GET /contests');
    console.log('   3. Join a contest and start answering!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed();
