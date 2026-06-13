import { create } from 'zustand'

type StatsState = {
  weeklySessions: number
  minutesMeditated: number
  exercisesCompleted: number
  incrementExercise: (minutes: number, isMeditation: boolean) => void
}

export const useStatsStore = create<StatsState>((set) => ({
  weeklySessions: 0,
  minutesMeditated: 0,
  exercisesCompleted: 0,
  incrementExercise: (minutes, isMeditation) =>
    set((state) => ({
      weeklySessions: state.weeklySessions + 1,
      exercisesCompleted: state.exercisesCompleted + 1,
      minutesMeditated: state.minutesMeditated + (isMeditation ? minutes : 0),
    })),
}))
