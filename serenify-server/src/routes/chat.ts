import { Router } from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { body } from 'express-validator'
import auth from '../middleware/auth'
import checkPlanLimit from '../middleware/checkPlanLimit'
import {
  deleteSession,
  getSession,
  getSessions,
  sendMessage,
  testGemini,
} from '../controllers/chatController'

const router = Router()

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Rate limit exceeded' },
  keyGenerator: (req) => {
    const reqWithUser = req as typeof req & { user?: { id: string } }
    return reqWithUser.user?.id ?? ipKeyGenerator(req.ip ?? '')
  },
})

router.post(
  '/message',
  auth,
  chatLimiter,
  checkPlanLimit('chat'),
  [body('message').isLength({ min: 1, max: 500 })],
  sendMessage,
)
router.get('/sessions', auth, getSessions)
router.get('/sessions/:id', auth, getSession)
router.delete('/sessions/:id', auth, deleteSession)
router.get('/test-gemini', testGemini)

export default router
