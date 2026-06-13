import { Router } from 'express'
import {
  getTherapistAvailability,
  getTherapistById,
  getTherapists,
} from '../controllers/therapist.controller'

const router = Router()

router.get('/', getTherapists)
router.get('/:id', getTherapistById)
router.get('/:id/availability', getTherapistAvailability)

export default router
