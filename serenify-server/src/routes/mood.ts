import { Router } from 'express'
import { body } from 'express-validator'
import { getMoodHistory, getMoodWeekly, logMood } from '../controllers/moodController'

const router = Router()

router.post(
  '/',
  [body('mood').isIn(['HAPPY', 'CALM', 'NEUTRAL', 'SAD', 'ANXIOUS'])],
  logMood,
)
router.get('/history', getMoodHistory)
router.get('/weekly', getMoodWeekly)

export default router
