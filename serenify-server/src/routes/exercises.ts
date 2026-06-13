import { Router } from 'express'
import {
  completeExercise,
  getExerciseById,
  getExerciseHistory,
  listExercises,
  saveJournalEntry,
} from '../controllers/exerciseController'
import checkPlanLimit from '../middleware/checkPlanLimit'

const router = Router()

router.get('/', checkPlanLimit('exercise-view'), listExercises)
router.get('/history', getExerciseHistory)
router.get('/:id', getExerciseById)
router.post('/:id/complete', completeExercise)
router.post('/:id/journal', saveJournalEntry)

export default router
