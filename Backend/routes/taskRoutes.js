import express from 'express';
import * as taskController from '../controllers/taskController.js';
import * as commentController from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/trash', taskController.getTrashedTasks);
router.delete('/trash/empty', taskController.emptyTrash);

router.get('/:id/comments', commentController.getComments);
router.post('/:id/comments', commentController.addComment);
router.put('/:id/comments/:commentId', commentController.updateComment);
router.delete('/:id/comments/:commentId', commentController.deleteComment);
router.get('/:id/activity', commentController.getTaskActivity);

router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.patch('/:id/trash', taskController.softDeleteTask);
router.patch('/:id/restore', taskController.restoreTask);
router.delete('/:id', taskController.permanentDeleteTask);

export default router;
