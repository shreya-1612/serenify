import bcrypt from 'bcrypt'
import type { ChecklistFrequency, ExerciseCategory, Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const quotes = [
  { text: 'Soft mornings build steady hearts.', author: 'Serenify', category: 'calm' },
  { text: 'Rest is a rhythm, not a reward.', author: 'Serenify', category: 'rest' },
  { text: 'You can be brave and tired at once.', author: 'Serenify', category: 'encouragement' },
  { text: 'Tiny pauses add up to big peace.', author: 'Serenify', category: 'mindfulness' },
  { text: 'Let your breath be a gentle anchor.', author: 'Serenify', category: 'breathing' },
  { text: 'Healing is quieter than hustle.', author: 'Serenify', category: 'healing' },
  { text: 'Choose softness, then choose it again.', author: 'Serenify', category: 'self-care' },
  { text: 'Progress can whisper instead of shout.', author: 'Serenify', category: 'growth' },
  { text: 'You are allowed to go at your pace.', author: 'Serenify', category: 'encouragement' },
  { text: 'Evening light teaches gentle endings.', author: 'Serenify', category: 'rest' },
  { text: 'The body remembers safety by repetition.', author: 'Serenify', category: 'grounding' },
  { text: 'One steady breath is enough to begin.', author: 'Serenify', category: 'breathing' },
  { text: 'Your mind deserves a soft landing.', author: 'Serenify', category: 'calm' },
  { text: 'Kindness is a daily practice, not a single act.', author: 'Serenify', category: 'self-care' },
  { text: 'Let calm be contagious.', author: 'Serenify', category: 'calm' },
  { text: 'You are not behind, you are here.', author: 'Serenify', category: 'presence' },
  { text: 'Breathe in ease, breathe out pressure.', author: 'Serenify', category: 'breathing' },
  { text: 'Small rituals become safe harbors.', author: 'Serenify', category: 'rituals' },
  { text: 'Notice what is steady, not only what is loud.', author: 'Serenify', category: 'mindfulness' },
  { text: 'Gentle consistency builds trust within.', author: 'Serenify', category: 'growth' },
  { text: 'Give your thoughts a softer tone.', author: 'Serenify', category: 'self-talk' },
  { text: 'A calm moment is a form of courage.', author: 'Serenify', category: 'encouragement' },
  { text: 'The present is a safe place to stand.', author: 'Serenify', category: 'presence' },
  { text: 'Release what is heavy, keep what is true.', author: 'Serenify', category: 'healing' },
  { text: 'You are allowed to ask for support.', author: 'Serenify', category: 'support' },
  { text: 'Quiet strength grows in patient light.', author: 'Serenify', category: 'growth' },
  { text: 'Softer days still count as forward.', author: 'Serenify', category: 'growth' },
  { text: 'Let today be enough.', author: 'Serenify', category: 'rest' },
  { text: 'Care can be simple and still be powerful.', author: 'Serenify', category: 'self-care' },
  { text: 'You can pause without losing momentum.', author: 'Serenify', category: 'balance' },
  { text: 'Peace is a practice, not a destination.', author: 'Serenify', category: 'mindfulness' },
  { text: 'Slow is still a direction.', author: 'Serenify', category: 'encouragement' },
  { text: 'Your heart knows how to return to calm.', author: 'Serenify', category: 'calm' },
  { text: 'Today, choose the kindest next step.', author: 'Serenify', category: 'self-care' },
  { text: 'Breathing deeply is a form of trust.', author: 'Serenify', category: 'breathing' },
  { text: 'You are allowed to be a beginner.', author: 'Serenify', category: 'growth' },
  { text: 'Practice ease like you practice effort.', author: 'Serenify', category: 'balance' },
  { text: 'Let your routines hold you gently.', author: 'Serenify', category: 'rituals' },
  { text: 'A softer inner voice changes everything.', author: 'Serenify', category: 'self-talk' },
  { text: 'Trust the quiet progress you make.', author: 'Serenify', category: 'growth' },
  { text: 'You are worthy of a calm moment.', author: 'Serenify', category: 'calm' },
  { text: 'Give yourself the grace you give others.', author: 'Serenify', category: 'self-care' },
  { text: 'The breath brings you back, every time.', author: 'Serenify', category: 'breathing' },
  { text: 'Simplicity can feel like relief.', author: 'Serenify', category: 'rest' },
  { text: 'Gentleness is not weakness.', author: 'Serenify', category: 'encouragement' },
  { text: 'Let your nervous system exhale.', author: 'Serenify', category: 'grounding' },
  { text: 'Space between thoughts is also peace.', author: 'Serenify', category: 'mindfulness' },
  { text: 'Soft rituals make strong foundations.', author: 'Serenify', category: 'rituals' },
  { text: 'Even one mindful minute matters.', author: 'Serenify', category: 'mindfulness' },
  { text: 'You can reset at any moment.', author: 'Serenify', category: 'healing' },
]

const exercises: Prisma.ExerciseCreateManyInput[] = [
  {
    title: 'Box breathing reset',
    category: 'BREATHING' as ExerciseCategory,
    duration: 6,
    difficulty: 2,
    description: 'Slow the nervous system with equal counts of breath.',
    content: {
      steps: [
        'Inhale for 4 counts',
        'Hold for 4 counts',
        'Exhale for 4 counts',
        'Hold for 4 counts',
        'Repeat for 4 rounds',
      ],
      tips: ['Sit tall', 'Relax your shoulders'],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
  {
    title: 'Ocean breath',
    category: 'BREATHING' as ExerciseCategory,
    duration: 5,
    difficulty: 3,
    description: 'Create a soothing sound on each exhale to extend the breath.',
    content: {
      steps: [
        'Inhale through the nose for 4 counts',
        'Exhale through the nose for 6 counts with a gentle sound',
        'Repeat for 6 rounds',
      ],
      tips: ['Keep the jaw soft', 'Relax the tongue'],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
  {
    title: 'Mindful minute',
    category: 'MEDITATION' as ExerciseCategory,
    duration: 8,
    difficulty: 1,
    description: 'A short meditation for grounding and clarity.',
    content: {
      steps: [
        'Sit comfortably with hands on your lap',
        'Notice the breath moving in and out',
        'Label thoughts and let them pass',
        'Return to the breath',
      ],
      tips: ['Keep eyes soft or closed'],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
  {
    title: 'Loving kindness',
    category: 'MEDITATION' as ExerciseCategory,
    duration: 10,
    difficulty: 2,
    description: 'Offer gentle phrases of care to yourself and others.',
    content: {
      steps: [
        'Inhale and say: May I be safe',
        'Exhale and say: May I be at ease',
        'Expand the phrases to someone you love',
      ],
      tips: ['Let the phrases feel natural'],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1470167290877-7d5d3446de4c?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
  {
    title: '5-4-3-2-1 grounding',
    category: 'GROUNDING' as ExerciseCategory,
    duration: 7,
    difficulty: 2,
    description: 'Bring awareness to your senses to reduce anxious spirals.',
    content: {
      steps: [
        'Name 5 things you can see',
        'Name 4 things you can feel',
        'Name 3 things you can hear',
        'Name 2 things you can smell',
        'Name 1 thing you can taste',
      ],
      tips: ['Take your time with each sense'],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1505480449763-113911c71b2d?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
  {
    title: 'Feet on the floor',
    category: 'GROUNDING' as ExerciseCategory,
    duration: 5,
    difficulty: 1,
    description: 'Reconnect with the body by noticing contact and pressure.',
    content: {
      steps: [
        'Plant both feet flat on the floor',
        'Press down gently for 5 seconds',
        'Release and notice the sensation',
        'Repeat 3 times',
      ],
      tips: ['Pair with slow exhales'],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
  {
    title: 'Evening reflection',
    category: 'JOURNALING' as ExerciseCategory,
    duration: 12,
    difficulty: 2,
    description: 'Reflect on wins and lessons with gentle prompts.',
    content: {
      prompts: [
        'What helped me feel steady today?',
        'What do I want to release before rest?',
        'What am I grateful for right now?',
      ],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
  {
    title: 'Compassionate check-in',
    category: 'JOURNALING' as ExerciseCategory,
    duration: 10,
    difficulty: 2,
    description: 'Name emotions and needs without judgment.',
    content: {
      prompts: [
        'What emotions are here right now?',
        'What do I need more of today?',
        'What support can I ask for?',
      ],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
  {
    title: 'Sleep body scan',
    category: 'SLEEP' as ExerciseCategory,
    duration: 15,
    difficulty: 1,
    description: 'A slow scan to relax muscles before bed.',
    content: {
      steps: [
        'Start at the crown of the head',
        'Relax the jaw, shoulders, and chest',
        'Soften the belly and hips',
        'Release the legs and feet',
      ],
      tips: ['Keep breathing slow and even'],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
  {
    title: 'Evening gratitude',
    category: 'SLEEP' as ExerciseCategory,
    duration: 6,
    difficulty: 1,
    description: 'Close the day with three gratitude notes.',
    content: {
      prompts: ['Three small moments that brought ease today'],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1484591974057-265bb767ef71?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
  {
    title: 'Midday grounding stretch',
    category: 'GROUNDING' as ExerciseCategory,
    duration: 9,
    difficulty: 3,
    description: 'Gentle movement to release tension and reset focus.',
    content: {
      steps: [
        'Reach arms overhead and inhale',
        'Fold forward and exhale',
        'Twist gently to each side',
      ],
      tips: ['Move slowly', 'Keep knees soft'],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
  {
    title: 'Morning clarity journal',
    category: 'JOURNALING' as ExerciseCategory,
    duration: 8,
    difficulty: 1,
    description: 'Set intentions with a clear, focused mind.',
    content: {
      prompts: [
        'What kind of day do I want to create?',
        'What is one caring action I can take today?',
      ],
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
    isSeeded: true,
  },
]

const therapists = [
  {
    name: 'Dr. Priya Sharma',
    specialty: 'Anxiety',
    bio: 'Dr. Priya Sharma has 10 years of experience helping clients manage anxiety and stress using cognitive behavioral therapy. She creates a warm, non-judgmental space for healing and growth.',
    avatarUrl:
      'https://ui-avatars.com/api/?name=Priya+Sharma&background=E8D5C4&color=5D3A1A&size=200&bold=true&format=svg',
    price: 800,
    rating: 4.9,
    experience: 10,
    availability: {
      timezone: 'Asia/Kolkata',
      slots: {
        Monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        Tuesday: ['09:00', '10:00', '14:00', '15:00'],
        Wednesday: ['10:00', '11:00', '14:00', '15:00'],
        Thursday: ['09:00', '10:00', '11:00'],
        Friday: ['09:00', '10:00', '14:00', '15:00'],
      },
    },
  },
  {
    name: 'Dr. Arjun Mehta',
    specialty: 'Depression',
    bio: 'Dr. Arjun Mehta specializes in depression and mood disorders. With 8 years of experience, he uses evidence-based approaches including CBT and mindfulness to help clients regain joy and purpose.',
    avatarUrl:
      'https://ui-avatars.com/api/?name=Arjun+Mehta&background=C4D5E8&color=1A3A5D&size=200&bold=true&format=svg',
    price: 900,
    rating: 4.8,
    experience: 8,
    availability: {
      timezone: 'Asia/Kolkata',
      slots: {
        Monday: ['10:00', '11:00', '14:00'],
        Tuesday: ['09:00', '10:00', '15:00', '16:00'],
        Thursday: ['09:00', '10:00', '14:00', '15:00'],
        Friday: ['09:00', '10:00', '11:00'],
      },
    },
  },
  {
    name: 'Dr. Neha Kapoor',
    specialty: 'Trauma',
    bio: 'Dr. Neha Kapoor is a trauma-informed therapist with 12 years of experience. She specializes in PTSD treatment using EMDR and somatic therapies to help clients heal from deep wounds.',
    avatarUrl:
      'https://ui-avatars.com/api/?name=Neha+Kapoor&background=E8D5C4&color=5D3A1A&size=200&bold=true&format=svg',
    price: 1000,
    rating: 4.9,
    experience: 12,
    availability: {
      timezone: 'Asia/Kolkata',
      slots: {
        Tuesday: ['09:00', '10:00', '11:00', '14:00'],
        Wednesday: ['09:00', '10:00', '14:00', '15:00'],
        Thursday: ['10:00', '11:00', '14:00'],
        Friday: ['09:00', '10:00', '11:00', '14:00'],
      },
    },
  },
  {
    name: 'Dr. Rohan Verma',
    specialty: 'Relationships',
    bio: 'Dr. Rohan Verma focuses on relationship issues and communication patterns. He helps individuals and couples build healthier, more fulfilling connections through CBT and emotionally focused therapy.',
    avatarUrl:
      'https://ui-avatars.com/api/?name=Rohan+Verma&background=C4D5E8&color=1A3A5D&size=200&bold=true&format=svg',
    price: 750,
    rating: 4.7,
    experience: 6,
    availability: {
      timezone: 'Asia/Kolkata',
      slots: {
        Monday: ['09:00', '10:00', '14:00', '15:00', '16:00'],
        Wednesday: ['09:00', '10:00', '11:00', '14:00'],
        Thursday: ['09:00', '14:00', '15:00'],
        Friday: ['10:00', '11:00', '14:00', '15:00'],
      },
    },
  },
  {
    name: 'Dr. Sunita Rao',
    specialty: 'Sleep',
    bio: 'Dr. Sunita Rao is an expert in sleep disorders and mindfulness-based therapies. She combines traditional therapy with meditation and relaxation techniques for holistic wellness.',
    avatarUrl:
      'https://ui-avatars.com/api/?name=Sunita+Rao&background=E8D5C4&color=5D3A1A&size=200&bold=true&format=svg',
    price: 700,
    rating: 4.8,
    experience: 9,
    availability: {
      timezone: 'Asia/Kolkata',
      slots: {
        Monday: ['14:00', '15:00', '16:00', '17:00'],
        Tuesday: ['14:00', '15:00', '16:00'],
        Wednesday: ['14:00', '15:00', '16:00'],
        Thursday: ['14:00', '15:00', '16:00', '17:00'],
        Friday: ['14:00', '15:00'],
      },
    },
  },
  {
    name: 'Dr. Vikram Singh',
    specialty: 'CBT',
    bio: 'Dr. Vikram Singh specializes in cognitive behavioral therapy for young adults navigating identity, academic pressure, and life transitions. He creates a safe and relatable space for growth.',
    avatarUrl:
      'https://ui-avatars.com/api/?name=Vikram+Singh&background=C4D5E8&color=1A3A5D&size=200&bold=true&format=svg',
    price: 650,
    rating: 4.6,
    experience: 5,
    availability: {
      timezone: 'Asia/Kolkata',
      slots: {
        Monday: ['15:00', '16:00', '17:00', '18:00'],
        Tuesday: ['15:00', '16:00', '17:00'],
        Thursday: ['15:00', '16:00', '17:00', '18:00'],
        Friday: ['15:00', '16:00', '17:00'],
        Saturday: ['10:00', '11:00', '12:00'],
      },
    },
  },
  {
    name: 'Dr. Ananya Iyer',
    specialty: 'Anxiety',
    bio: 'Dr. Ananya Iyer combines yoga philosophy with modern psychology to treat anxiety and panic disorders. She has helped hundreds of clients find calm through breath-centered therapy.',
    avatarUrl:
      'https://ui-avatars.com/api/?name=Ananya+Iyer&background=E8D5C4&color=5D3A1A&size=200&bold=true&format=svg',
    price: 850,
    rating: 4.8,
    experience: 7,
    availability: {
      timezone: 'Asia/Kolkata',
      slots: {
        Monday: ['09:00', '10:00', '11:00'],
        Tuesday: ['09:00', '10:00', '11:00', '14:00'],
        Wednesday: ['09:00', '10:00'],
        Friday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      },
    },
  },
  {
    name: 'Dr. Kabir Nair',
    specialty: 'Depression',
    bio: 'Dr. Kabir Nair is a compassionate therapist with expertise in depression, burnout, and work-life stress. He uses an integrative approach blending CBT, ACT, and positive psychology.',
    avatarUrl:
      'https://ui-avatars.com/api/?name=Kabir+Nair&background=C4D5E8&color=1A3A5D&size=200&bold=true&format=svg',
    price: 800,
    rating: 4.7,
    experience: 7,
    availability: {
      timezone: 'Asia/Kolkata',
      slots: {
        Tuesday: ['10:00', '11:00', '14:00', '15:00'],
        Wednesday: ['10:00', '11:00', '14:00'],
        Thursday: ['10:00', '11:00', '14:00', '15:00'],
        Saturday: ['09:00', '10:00', '11:00'],
      },
    },
  },
]

const checklistTemplates: Array<{
  label: string
  emoji: string
  frequency: ChecklistFrequency
}> = [
  { label: 'Meditate for 10 minutes', emoji: '🧘', frequency: 'DAILY' },
  { label: 'Drink 8 glasses of water', emoji: '💧', frequency: 'DAILY' },
  { label: 'Write in journal', emoji: '📓', frequency: 'DAILY' },
  { label: 'Exercise for 30 minutes', emoji: '🏃', frequency: 'DAILY' },
  { label: 'Get 7-8 hours of sleep', emoji: '😴', frequency: 'DAILY' },
  { label: 'Practice gratitude', emoji: '🙏', frequency: 'DAILY' },
  { label: 'Limit screen time', emoji: '📵', frequency: 'DAILY' },
]

async function main() {
  const passwordHash = await bcrypt.hash('Serenify123!', 10)
  const templateUser = await prisma.user.upsert({
    where: { email: 'default@serenify.app' },
    update: {},
    create: {
      name: 'Serenify Defaults',
      email: 'default@serenify.app',
      passwordHash,
      plan: 'FREE',
    },
  })

  await prisma.quote.createMany({
    data: quotes,
    skipDuplicates: true,
  })

  await prisma.exerciseLog.deleteMany({})
  await prisma.exercise.deleteMany({})
  await prisma.exercise.createMany({
    data: exercises,
  })

  await prisma.therapist.deleteMany({})
  await prisma.therapist.createMany({
    data: therapists,
    skipDuplicates: true,
  })

  await Promise.all([
    prisma.therapist.updateMany({
      where: { name: 'Dr. Priya Sharma' },
      data: {
        avatarUrl:
          'https://ui-avatars.com/api/?name=Priya+Sharma&background=E8D5C4&color=5D3A1A&size=200&bold=true&format=svg',
      },
    }),
    prisma.therapist.updateMany({
      where: { name: 'Dr. Arjun Mehta' },
      data: {
        avatarUrl:
          'https://ui-avatars.com/api/?name=Arjun+Mehta&background=C4D5E8&color=1A3A5D&size=200&bold=true&format=svg',
      },
    }),
    prisma.therapist.updateMany({
      where: { name: 'Dr. Neha Kapoor' },
      data: {
        avatarUrl:
          'https://ui-avatars.com/api/?name=Neha+Kapoor&background=E8D5C4&color=5D3A1A&size=200&bold=true&format=svg',
      },
    }),
    prisma.therapist.updateMany({
      where: { name: 'Dr. Rohan Verma' },
      data: {
        avatarUrl:
          'https://ui-avatars.com/api/?name=Rohan+Verma&background=C4D5E8&color=1A3A5D&size=200&bold=true&format=svg',
      },
    }),
    prisma.therapist.updateMany({
      where: { name: 'Dr. Sunita Rao' },
      data: {
        avatarUrl:
          'https://ui-avatars.com/api/?name=Sunita+Rao&background=E8D5C4&color=5D3A1A&size=200&bold=true&format=svg',
      },
    }),
    prisma.therapist.updateMany({
      where: { name: 'Dr. Vikram Singh' },
      data: {
        avatarUrl:
          'https://ui-avatars.com/api/?name=Vikram+Singh&background=C4D5E8&color=1A3A5D&size=200&bold=true&format=svg',
      },
    }),
    prisma.therapist.updateMany({
      where: { name: 'Dr. Ananya Iyer' },
      data: {
        avatarUrl:
          'https://ui-avatars.com/api/?name=Ananya+Iyer&background=E8D5C4&color=5D3A1A&size=200&bold=true&format=svg',
      },
    }),
    prisma.therapist.updateMany({
      where: { name: 'Dr. Kabir Nair' },
      data: {
        avatarUrl:
          'https://ui-avatars.com/api/?name=Kabir+Nair&background=C4D5E8&color=1A3A5D&size=200&bold=true&format=svg',
      },
    }),
  ])

  await prisma.checklistItem.createMany({
    data: checklistTemplates.map(
      (item): Prisma.ChecklistItemCreateManyInput => ({
        ...item,
        userId: templateUser.id,
        isDefault: true,
        isActive: true,
        streak: 0,
      }),
    ),
    skipDuplicates: true,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
