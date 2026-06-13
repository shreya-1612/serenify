import { Router } from 'express'
import {
  changePassword,
  deleteAccount,
  getProfile,
  updateProfile,
} from '../controllers/userController'

const router = Router()

router.get('/profile', getProfile)
router.patch('/profile', updateProfile)
router.post('/change-password', changePassword)
router.delete('/account', deleteAccount)

export default router
