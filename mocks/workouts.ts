import { Workout } from "@/types";
import { exercises } from "./exercises";

export const workouts: Workout[] = [
  {
    id: "w1",
    name: "Full Body Strength",
    description: "A comprehensive full-body workout targeting all major muscle groups.",
    exercises: [exercises[0], exercises[1], exercises[2], exercises[5]],
    duration: 60,
    estimatedDuration: 60,
    difficulty: "intermediate",
    category: "Strength",
    intensity: "high",
  },
  {
    id: "w2",
    name: "Upper Body Focus",
    description: "Concentrate on developing your chest, back, and arms.",
    exercises: [exercises[0], exercises[3], exercises[5]],
    duration: 45,
    estimatedDuration: 45,
    difficulty: "intermediate",
    category: "Strength",
    intensity: "medium",
  },
  {
    id: "w3",
    name: "Lower Body Power",
    description: "Build strength and power in your legs and glutes.",
    exercises: [exercises[1], exercises[2]],
    duration: 40,
    estimatedDuration: 40,
    difficulty: "advanced",
    category: "Strength",
    intensity: "high",
  },
  {
    id: "w4",
    name: "Core Stability",
    description: "Develop a strong and stable core with these targeted exercises.",
    exercises: [exercises[4]],
    duration: 30,
    estimatedDuration: 30,
    difficulty: "beginner",
    category: "Core",
    intensity: "medium",
  },
  // New bodyweight workouts
  {
    id: "w5",
    name: "Bodyweight Basics",
    description: "A beginner-friendly workout using only your bodyweight.",
    exercises: [exercises[6], exercises[7], exercises[4], exercises[8]],
    duration: 30,
    estimatedDuration: 30,
    difficulty: "beginner",
    category: "Bodyweight",
    intensity: "low",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w6",
    name: "HIIT Bodyweight Circuit",
    description: "High-intensity interval training using bodyweight exercises to burn calories and improve conditioning.",
    exercises: [exercises[6], exercises[9], exercises[10], exercises[8]],
    duration: 25,
    estimatedDuration: 25,
    difficulty: "intermediate",
    category: "Bodyweight",
    intensity: "high",
    imageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w7",
    name: "Advanced Bodyweight Training",
    description: "Challenge yourself with this advanced bodyweight workout that builds strength and endurance.",
    exercises: [exercises[3], exercises[10], exercises[11], exercises[9]],
    duration: 45,
    estimatedDuration: 45,
    difficulty: "advanced",
    category: "Bodyweight",
    intensity: "high",
    imageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w8",
    name: "Upper Body Bodyweight",
    description: "Focus on your upper body using only bodyweight exercises.",
    exercises: [exercises[6], exercises[3], exercises[11]],
    duration: 35,
    estimatedDuration: 35,
    difficulty: "intermediate",
    category: "Bodyweight",
    intensity: "medium",
    imageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w9",
    name: "Core & Cardio Combo",
    description: "Combine core strengthening with cardio for an effective full-body workout.",
    exercises: [exercises[4], exercises[9], exercises[10]],
    duration: 30,
    estimatedDuration: 30,
    difficulty: "intermediate",
    category: "Bodyweight",
    intensity: "medium",
    imageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  // New workouts based on musclewiki and darebee
  {
    id: "w10",
    name: "Push-Pull-Legs Split: Push Day",
    description: "Focus on all pushing movements targeting chest, shoulders, and triceps.",
    exercises: [
      exercises.find(e => e.name === "Barbell Bench Press") || exercises[0],
      exercises.find(e => e.name === "Incline Dumbbell Press") || exercises[13],
      exercises.find(e => e.name === "Dumbbell Shoulder Press") || exercises[6],
      exercises.find(e => e.name === "Tricep Pushdown") || exercises[33]
    ],
    duration: 50,
    estimatedDuration: 50,
    difficulty: "intermediate",
    category: "Strength",
    intensity: "high",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w11",
    name: "Push-Pull-Legs Split: Pull Day",
    description: "Focus on all pulling movements targeting back and biceps.",
    exercises: [
      exercises.find(e => e.name === "Pull-up") || exercises[4],
      exercises.find(e => e.name === "Barbell Row") || exercises[21],
      exercises.find(e => e.name === "Lat Pulldown") || exercises[19],
      exercises.find(e => e.name === "Bicep Curl") || exercises[32]
    ],
    duration: 50,
    estimatedDuration: 50,
    difficulty: "intermediate",
    category: "Strength",
    intensity: "high",
    imageUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w12",
    name: "Push-Pull-Legs Split: Leg Day",
    description: "Focus on lower body development with compound and isolation movements.",
    exercises: [
      exercises.find(e => e.name === "Squat") || exercises[2],
      exercises.find(e => e.name === "Romanian Deadlift") || exercises[16],
      exercises.find(e => e.name === "Leg Press") || exercises[15],
      exercises.find(e => e.name === "Leg Curl") || exercises[18]
    ],
    duration: 50,
    estimatedDuration: 50,
    difficulty: "intermediate",
    category: "Strength",
    intensity: "high",
    imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w13",
    name: "Functional Fitness Circuit",
    description: "Build practical strength and endurance with functional movements.",
    exercises: [
      exercises.find(e => e.name === "Kettlebell Swing") || exercises.find(e => e.id === "ex121") || exercises[1],
      exercises.find(e => e.name === "Medicine Ball Slam") || exercises.find(e => e.id === "ex122") || exercises[10],
      exercises.find(e => e.name === "Battle Ropes") || exercises.find(e => e.id === "ex123") || exercises[9],
      exercises.find(e => e.name === "Farmer's Walk") || exercises.find(e => e.id === "ex124") || exercises[8]
    ],
    duration: 40,
    estimatedDuration: 40,
    difficulty: "intermediate",
    category: "Functional",
    intensity: "medium",
    imageUrl: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w14",
    name: "30-Minute HIIT Blast",
    description: "Maximize calorie burn and cardiovascular fitness with this high-intensity interval training workout.",
    exercises: [
      exercises.find(e => e.name === "Burpees") || exercises[11],
      exercises.find(e => e.name === "Mountain Climbers") || exercises[10],
      exercises.find(e => e.name === "Jumping Jacks") || exercises.find(e => e.id === "ex115") || exercises[30],
      exercises.find(e => e.name === "High Knees") || exercises[31]
    ],
    duration: 30,
    estimatedDuration: 30,
    difficulty: "intermediate",
    category: "Cardio",
    intensity: "high",
    imageUrl: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w15",
    name: "Core Crusher",
    description: "Target your abs, obliques, and lower back with this comprehensive core workout.",
    exercises: [
      exercises.find(e => e.name === "Plank") || exercises[5],
      exercises.find(e => e.name === "Russian Twist") || exercises[22],
      exercises.find(e => e.name === "Bicycle Crunch") || exercises.find(e => e.id === "ex108") || exercises[4],
      exercises.find(e => e.name === "Side Plank") || exercises.find(e => e.id === "ex110") || exercises[4]
    ],
    duration: 25,
    estimatedDuration: 25,
    difficulty: "intermediate",
    category: "Core",
    intensity: "medium",
    imageUrl: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w16",
    name: "Dumbbell-Only Workout",
    description: "A complete full-body workout using only dumbbells, perfect for home or gym.",
    exercises: [
      exercises.find(e => e.name === "Dumbbell Shoulder Press") || exercises[6],
      exercises.find(e => e.name === "Incline Dumbbell Press") || exercises[13],
      exercises.find(e => e.name === "Single-Arm Dumbbell Row") || exercises.find(e => e.id === "ex106") || exercises[21],
      exercises.find(e => e.name === "Bicep Curl") || exercises[32]
    ],
    duration: 45,
    estimatedDuration: 45,
    difficulty: "beginner",
    category: "Strength",
    intensity: "medium",
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w17",
    name: "Mobility & Flexibility",
    description: "Improve your range of motion and prevent injuries with this mobility-focused routine.",
    exercises: [
      exercises.find(e => e.name === "Bodyweight Squat") || exercises[8],
      exercises.find(e => e.name === "Lunges") || exercises[9],
      exercises.find(e => e.name === "Glute Bridge") || exercises.find(e => e.id === "ex104") || exercises[7],
      exercises.find(e => e.name === "Dead Bug") || exercises.find(e => e.id === "ex109") || exercises[4]
    ],
    duration: 30,
    estimatedDuration: 30,
    difficulty: "beginner",
    category: "Mobility",
    intensity: "low",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w18",
    name: "Arms Blaster",
    description: "Focus on building bigger, stronger arms with this biceps and triceps workout.",
    exercises: [
      exercises.find(e => e.name === "Bicep Curl") || exercises[32],
      exercises.find(e => e.name === "Tricep Pushdown") || exercises[33],
      exercises.find(e => e.name === "Hammer Curl") || exercises[34],
      exercises.find(e => e.name === "Skull Crusher") || exercises[35]
    ],
    duration: 35,
    estimatedDuration: 35,
    difficulty: "intermediate",
    category: "Strength",
    intensity: "medium",
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w19",
    name: "Chest Sculptor",
    description: "Build a stronger, more defined chest with this targeted workout.",
    exercises: [
      exercises.find(e => e.name === "Barbell Bench Press") || exercises[0],
      exercises.find(e => e.name === "Incline Dumbbell Press") || exercises[13],
      exercises.find(e => e.name === "Cable Chest Fly") || exercises[14],
      exercises.find(e => e.name === "Push-up") || exercises[7]
    ],
    duration: 40,
    estimatedDuration: 40,
    difficulty: "intermediate",
    category: "Strength",
    intensity: "medium",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w20",
    name: "Back Builder",
    description: "Develop a strong, wide back with this comprehensive back workout.",
    exercises: [
      exercises.find(e => e.name === "Pull-up") || exercises[4],
      exercises.find(e => e.name === "Barbell Row") || exercises[21],
      exercises.find(e => e.name === "Lat Pulldown") || exercises[19],
      exercises.find(e => e.name === "Seated Cable Row") || exercises[20]
    ],
    duration: 40,
    estimatedDuration: 40,
    difficulty: "intermediate",
    category: "Strength",
    intensity: "medium",
    imageUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  // Adding more shorter workouts for tired/not great users
  {
    id: "w21",
    name: "Quick Total Body",
    description: "A fast but effective full-body workout when you're short on time.",
    exercises: [
      exercises.find(e => e.name === "Push-up") || exercises[7],
      exercises.find(e => e.name === "Bodyweight Squat") || exercises[8],
      exercises.find(e => e.name === "Plank") || exercises[5]
    ],
    duration: 20,
    estimatedDuration: 20,
    difficulty: "beginner",
    category: "Bodyweight",
    intensity: "medium",
    imageUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w22",
    name: "15-Minute Energy Boost",
    description: "A quick workout to boost your energy when you're feeling tired.",
    exercises: [
      exercises.find(e => e.name === "Jumping Jacks") || exercises.find(e => e.id === "ex115") || exercises[30],
      exercises.find(e => e.name === "Mountain Climbers") || exercises[10],
      exercises.find(e => e.name === "High Knees") || exercises[31]
    ],
    duration: 15,
    estimatedDuration: 15,
    difficulty: "beginner",
    category: "Cardio",
    intensity: "low",
    imageUrl: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w23",
    name: "Quick Core Focus",
    description: "A short core workout that can be done when you're low on energy.",
    exercises: [
      exercises.find(e => e.name === "Plank") || exercises[5],
      exercises.find(e => e.name === "Bicycle Crunch") || exercises.find(e => e.id === "ex108") || exercises[4],
      exercises.find(e => e.name === "Russian Twist") || exercises[22]
    ],
    duration: 15,
    estimatedDuration: 15,
    difficulty: "beginner",
    category: "Core",
    intensity: "low",
    imageUrl: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w24",
    name: "Gentle Mobility Session",
    description: "A light mobility workout perfect for when you're feeling tired or sore.",
    exercises: [
      exercises.find(e => e.name === "Bodyweight Squat") || exercises[8],
      exercises.find(e => e.name === "Glute Bridge") || exercises.find(e => e.id === "ex104") || exercises[7],
      exercises.find(e => e.name === "Cat-Cow Stretch") || exercises.find(e => e.id === "ex125") || exercises[4]
    ],
    duration: 20,
    estimatedDuration: 20,
    difficulty: "beginner",
    category: "Mobility",
    intensity: "low",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  },
  {
    id: "w25",
    name: "25-Minute Upper Body",
    description: "A shorter upper body workout for days when you have limited time or energy.",
    exercises: [
      exercises.find(e => e.name === "Push-up") || exercises[7],
      exercises.find(e => e.name === "Dumbbell Shoulder Press") || exercises[6],
      exercises.find(e => e.name === "Bicep Curl") || exercises[32]
    ],
    duration: 25,
    estimatedDuration: 25,
    difficulty: "beginner",
    category: "Strength",
    intensity: "medium",
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  }
];