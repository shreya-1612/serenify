import { Router } from 'express'
import { getWeeklyProgress } from '../controllers/progressController'

const router = Router()

router.get('/weekly', getWeeklyProgress)

export default router
