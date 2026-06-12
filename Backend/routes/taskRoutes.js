import express from 'express';
import * as taskController from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Create a new task
router.post('/', taskController.createTask);

// Get all non‑deleted tasks (with optional filters)
router.get('/', taskController.getAllTasks);

// Get task statistics
router.get('/stats', taskController.getTaskStats);

// Get trashed tasks
router.get('/trash', taskController.getTrashedTasks);

// Empty trash
router.delete('/trash/empty', taskController.emptyTrash);

// Get a single task by ID
router.get('/:id', taskController.getTaskById);

// Update a task (including status/priority/etc.)
router.put('/:id', taskController.updateTask);

// Soft‑delete – move to trash
router.patch('/:id/trash', taskController.softDeleteTask);

// Restore from trash
router.patch('/:id/restore', taskController.restoreTask);

// Permanently delete a task (hard delete)
router.delete('/:id', taskController.permanentDeleteTask);

export default router;
