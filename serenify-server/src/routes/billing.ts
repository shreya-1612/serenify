import { Router } from 'express'
import {
  createCheckout,
  getInvoices,
  getSubscription,
} from '../controllers/billingController'

const router = Router()

router.post('/create-checkout', createCheckout)
router.get('/invoices', getInvoices)
router.get('/subscription', getSubscription)

export default router
