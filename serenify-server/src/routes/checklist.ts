import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import {
  completeChecklistItem,
  createChecklistItem,
  deleteChecklistItem,
  getChecklist,
  undoChecklistItem,
  updateChecklistItem,
} from '../controllers/checklistController'

const router = Router()

const ensureValid = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }
  next()
}

router.get('/', getChecklist)

router.post(
  '/',
  [
    body('label').isString().trim().notEmpty(),
    body('emoji').isString().trim().notEmpty(),
    body('frequency').isIn(['DAILY', 'WEEKLY']),
  ],
  ensureValid,
  createChecklistItem,
)

router.patch(
  '/:id',
  [
    body('label').optional().isString().trim().notEmpty(),
    body('emoji').optional().isString().trim().notEmpty(),
    body('frequency').optional().isIn(['DAILY', 'WEEKLY']),
    body('isActive').optional().isBoolean(),
  ],
  ensureValid,
  updateChecklistItem,
)

router.delete('/:id', deleteChecklistItem)
router.post('/:id/complete', completeChecklistItem)
router.delete('/:id/complete', undoChecklistItem)

export default router
