import { Router } from 'express'
import { body } from 'express-validator'
import {
  forgotPassword,
  login,
  logout,
  refreshToken,
  resetPassword,
  signup,
} from '../controllers/authController'

const router = Router()

const passwordRule = body('password')
  .isLength({ min: 8 })
  .matches(/[A-Z]/)
  .matches(/[0-9]/)
  .withMessage('Password must be 8+ chars with uppercase and number')

router.post(
  '/signup',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    passwordRule,
  ],
  signup,
)
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  login,
)
router.post('/logout', logout)
router.post('/refresh', refreshToken)
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  forgotPassword,
)
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
    passwordRule,
  ],
  resetPassword,
)

export default router
