import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { createPlaybook, deletePlaybook, listPlaybooks } from '../services/playbooks.service.js';

export const playbooksRouter = Router();

playbooksRouter.use(requireAuth);

playbooksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const playbooks = await listPlaybooks(req.userId!);
    res.status(200).json({ playbooks });
  })
);

playbooksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const playbook = await createPlaybook(req.userId!, req.body);
    res.status(201).json({ playbook });
  })
);

playbooksRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deletePlaybook(req.userId!, req.params.id);
    res.status(204).send();
  })
);
