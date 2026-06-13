import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import {
  cancelAppointment,
  createAppointment,
  getAppointments,
  rescheduleAppointment,
} from '../controllers/appointment.controller'
import checkPlanLimit from '../middleware/checkPlanLimit'

const router = Router()

const ensureValid = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }
  next()
}

router.get('/', getAppointments)

router.post(
  '/',
  checkPlanLimit('therapy-booking'),
  [
    body('therapistId').isString().notEmpty(),
    body('datetime').isISO8601(),
    body('type').isIn(['VIDEO', 'CHAT', 'PHONE']),
    body('notes').optional().isString(),
  ],
  ensureValid,
  createAppointment,
)

router.patch('/:id/cancel', cancelAppointment)

router.patch(
  '/:id/reschedule',
  [body('datetime').isISO8601()],
  ensureValid,
  rescheduleAppointment,
)

export default router
