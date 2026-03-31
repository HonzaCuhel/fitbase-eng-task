import mongoose from 'mongoose'
import config from './_config.js'
import UserSchema from './routes/user/_user.schema.js'
import ClassSchema from './routes/class/_class.schema.js'
import MemberSchema from './routes/member/_member.schema.js'
import TrainerSchema from './routes/trainer/_trainer.schema.js'
import GymSchema from './routes/gym/_gym.schema.js'

const WORKSPACE = process.argv[2] || 'default'

async function seed() {
  const connection = await mongoose.createConnection(config.MONGO_DB_URI).asPromise()
  const db = connection.useDb(WORKSPACE)

  const User = db.model('User', UserSchema)
  const Class = db.model('Class', ClassSchema)
  const Member = db.model('Member', MemberSchema)
  const Trainer = db.model('Trainer', TrainerSchema)
  const Gym = db.model('Gym', GymSchema)

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Class.deleteMany({}),
    Member.deleteMany({}),
    Trainer.deleteMany({}),
    Gym.deleteMany({}),
  ])

  console.log('Cleared existing data')

  // Create gym
  await Gym.create({
    name: 'FitBase Studio',
    domain: WORKSPACE,
    branding: { primaryColor: '#4f46e5', font: 'Inter' },
    settings: { timezone: 'America/New_York', defaultLocale: 'en', currency: 'USD' },
    contact: { email: 'hello@fitbase.studio', phone: '+1 (555) 123-4567', address: '123 Fitness Ave, New York, NY 10001' },
  })

  // Create admin user
  await User.create({
    fullName: 'Alex Rivera',
    email: 'admin@fitbase.com',
    password: 'password123',
    role: 'admin',
    status: 'active',
    locale: 'en',
  })

  console.log('Created admin user: admin@fitbase.com / password123')

  // Create trainers
  const trainers = await Trainer.insertMany([
    {
      fullName: 'Sarah Chen',
      email: 'sarah@fitbase.com',
      specialties: ['Yoga', 'Pilates', 'Meditation'],
      bio: 'Certified yoga instructor with 8 years of experience. Specializes in Vinyasa and Hatha yoga.',
    },
    {
      fullName: 'Marcus Johnson',
      email: 'marcus@fitbase.com',
      specialties: ['HIIT', 'CrossFit', 'Strength'],
      bio: 'Former collegiate athlete turned fitness coach. NASM certified with focus on high-intensity training.',
    },
    {
      fullName: 'Elena Kowalski',
      email: 'elena@fitbase.com',
      specialties: ['Pilates', 'Barre', 'Stretching'],
      bio: 'Classical Pilates practitioner trained in the Romana method. 12 years of teaching experience.',
    },
  ])

  console.log(`Created ${trainers.length} trainers`)

  // Create classes
  const classes = await Class.insertMany([
    {
      general: {
        title: 'Morning Yoga Flow',
        description: 'Start your day with a gentle yet energizing vinyasa flow. Suitable for all levels.',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-06-30'),
        location: 'Studio A',
        capacity: 20,
        trainer: trainers[0]._id,
        tags: ['yoga', 'morning', 'all-levels'],
        status: 'published',
        type: 'yoga',
      },
      schedule: [
        { dayOfWeek: 1, startTime: '07:00', endTime: '08:00', room: 'Studio A' },
        { dayOfWeek: 3, startTime: '07:00', endTime: '08:00', room: 'Studio A' },
        { dayOfWeek: 5, startTime: '07:00', endTime: '08:00', room: 'Studio A' },
      ],
    },
    {
      general: {
        title: 'HIIT Blast',
        description: 'High-intensity interval training to maximize calorie burn and build endurance.',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-06-30'),
        location: 'Main Floor',
        capacity: 15,
        trainer: trainers[1]._id,
        tags: ['hiit', 'cardio', 'advanced'],
        status: 'published',
        type: 'hiit',
      },
      schedule: [
        { dayOfWeek: 2, startTime: '18:00', endTime: '19:00', room: 'Main Floor' },
        { dayOfWeek: 4, startTime: '18:00', endTime: '19:00', room: 'Main Floor' },
      ],
    },
    {
      general: {
        title: 'Pilates Core',
        description: 'Focus on core strength, flexibility, and body alignment through classical Pilates techniques.',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-06-30'),
        location: 'Studio B',
        capacity: 12,
        trainer: trainers[2]._id,
        tags: ['pilates', 'core', 'intermediate'],
        status: 'published',
        type: 'pilates',
      },
      schedule: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '11:00', room: 'Studio B' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '11:00', room: 'Studio B' },
      ],
    },
    {
      general: {
        title: 'Evening Meditation',
        description: 'Unwind with guided meditation and breathwork. Perfect for stress relief after a long day.',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-06-30'),
        location: 'Zen Room',
        capacity: 25,
        trainer: trainers[0]._id,
        tags: ['meditation', 'relaxation', 'evening'],
        status: 'published',
        type: 'meditation',
      },
      schedule: [
        { dayOfWeek: 2, startTime: '19:30', endTime: '20:15', room: 'Zen Room' },
        { dayOfWeek: 4, startTime: '19:30', endTime: '20:15', room: 'Zen Room' },
      ],
    },
    {
      general: {
        title: 'Power Strength',
        description: 'Build lean muscle with compound lifts and functional training. Bring your own water bottle.',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-07-31'),
        location: 'Weight Room',
        capacity: 10,
        trainer: trainers[1]._id,
        tags: ['strength', 'weights', 'advanced'],
        status: 'draft',
        type: 'strength',
      },
      schedule: [
        { dayOfWeek: 1, startTime: '17:00', endTime: '18:00', room: 'Weight Room' },
        { dayOfWeek: 5, startTime: '17:00', endTime: '18:00', room: 'Weight Room' },
      ],
    },
    {
      general: {
        title: 'Barre Basics',
        description: 'Ballet-inspired workout targeting small muscle groups for a lean, toned physique.',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-06-30'),
        location: 'Studio A',
        capacity: 18,
        trainer: trainers[2]._id,
        tags: ['barre', 'toning', 'beginner'],
        status: 'published',
        type: 'barre',
      },
      schedule: [
        { dayOfWeek: 2, startTime: '09:00', endTime: '10:00', room: 'Studio A' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '10:00', room: 'Studio A' },
        { dayOfWeek: 6, startTime: '10:00', endTime: '11:00', room: 'Studio A' },
      ],
    },
  ])

  console.log(`Created ${classes.length} classes`)

  // Create members
  const memberNames = [
    { firstName: 'Emma', lastName: 'Thompson', email: 'emma.t@email.com' },
    { firstName: 'James', lastName: 'Wilson', email: 'james.w@email.com' },
    { firstName: 'Sofia', lastName: 'Garcia', email: 'sofia.g@email.com' },
    { firstName: 'Liam', lastName: 'Brown', email: 'liam.b@email.com' },
    { firstName: 'Olivia', lastName: 'Davis', email: 'olivia.d@email.com' },
    { firstName: 'Noah', lastName: 'Martinez', email: 'noah.m@email.com' },
    { firstName: 'Ava', lastName: 'Anderson', email: 'ava.a@email.com' },
    { firstName: 'Lucas', lastName: 'Taylor', email: 'lucas.t@email.com' },
    { firstName: 'Mia', lastName: 'Thomas', email: 'mia.t@email.com' },
    { firstName: 'Ethan', lastName: 'Jackson', email: 'ethan.j@email.com' },
    { firstName: 'Isabella', lastName: 'White', email: 'isabella.w@email.com' },
    { firstName: 'Mason', lastName: 'Harris', email: 'mason.h@email.com' },
    { firstName: 'Charlotte', lastName: 'Martin', email: 'charlotte.m@email.com' },
    { firstName: 'Logan', lastName: 'Lee', email: 'logan.l@email.com' },
    { firstName: 'Amelia', lastName: 'Clark', email: 'amelia.c@email.com' },
    { firstName: 'Alexander', lastName: 'Lewis', email: 'alex.l@email.com' },
    { firstName: 'Harper', lastName: 'Robinson', email: 'harper.r@email.com' },
    { firstName: 'Benjamin', lastName: 'Walker', email: 'ben.w@email.com' },
    { firstName: 'Ella', lastName: 'Young', email: 'ella.y@email.com' },
    { firstName: 'Daniel', lastName: 'King', email: 'daniel.k@email.com' },
  ]

  const statuses = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, 1, 1, 0, 1, 1, -1]
  const members = []

  for (let i = 0; i < memberNames.length; i++) {
    const classIndex = i % classes.length
    const member = await Member.create({
      class: classes[classIndex]._id,
      properties: {
        ...memberNames[i],
        phone: `+1 (555) ${String(100 + i).padStart(3, '0')}-${String(1000 + i * 37).slice(0, 4)}`,
      },
      status: {
        confirmation: statuses[i],
        addMethod: i < 15 ? 'singleAdd' : 'batchImport',
      },
      enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    })
    members.push(member)
  }

  console.log(`Created ${members.length} members`)

  // Update enrollment counts
  for (const classDoc of classes) {
    const enrollmentCount = await Member.countDocuments({ class: classDoc._id, 'status.confirmation': 1 })
    const waitlistCount = await Member.countDocuments({ class: classDoc._id, 'status.confirmation': 2 })
    await Class.findByIdAndUpdate(classDoc._id, { enrollmentCount, waitlistCount })
  }

  console.log('Updated enrollment counts')
  console.log('\nSeed complete!')
  console.log(`Workspace: ${WORKSPACE}`)

  await connection.close()
  process.exit(0)
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
