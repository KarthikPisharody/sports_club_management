import { Router } from 'express';
import { db } from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// 1. Get all maintenance operations
router.get('/', (req, res) => {
  const state = db.getState();
  res.json({ maintenance: state.maintenance });
});

// 2. Admin: Add specific maintenance operation
router.post('/', requireRole('admin'), (req, res) => {
  const { target_type, target_id, description, priority = 'Medium', scheduled_date, technician_notes } = req.body;
  if (!target_type || !target_id || !description) {
    return res.status(400).json({ error: 'Missing required maintenance fields: target_type, target_id, description' });
  }

  const state = db.getState();
  const todayStr = new Date().toISOString().slice(0, 10);
  const newOp = {
    operation_id: state.maintenance.length + 1,
    target_type,
    target_id,
    description,
    priority,
    request_status: 'Pending',
    scheduled_date: scheduled_date || todayStr,
    technician_notes: technician_notes || ''
  };

  // TRIGGER LOGIC: Set target status to 'Under Maintenance'
  if (target_type === 'venue') {
    const v = state.venues.find(ven => ven.venue_id === target_id);
    if (v) v.status = 'Under Maintenance';
  } else if (target_type === 'equipment') {
    const eq = state.equipment.find(e => e.asset_id === target_id);
    if (eq) eq.status = 'Under Maintenance';
  }

  state.maintenance.unshift(newOp);
  res.status(201).json({ message: 'Maintenance operation scheduled successfully', operation: newOp });
});

// 3. Admin: Remove specific maintenance operation
router.delete('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const state = db.getState();

  const idx = state.maintenance.findIndex(m => m.operation_id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Maintenance operation not found' });
  }

  const removed = state.maintenance.splice(idx, 1)[0];

  // If no other pending/in-progress maintenance for target, restore Available
  const remaining = state.maintenance.filter(m => m.target_id === removed.target_id && m.request_status !== 'Completed');
  if (remaining.length === 0) {
    if (removed.target_type === 'venue') {
      const v = state.venues.find(ven => ven.venue_id === removed.target_id);
      if (v && v.status === 'Under Maintenance') v.status = 'Available';
    } else if (removed.target_type === 'equipment') {
      const eq = state.equipment.find(e => e.asset_id === removed.target_id);
      if (eq && eq.status === 'Under Maintenance') eq.status = 'Available';
    }
  }

  res.json({ message: `Maintenance operation ${id} removed successfully` });
});

// 4. Admin: Update status of maintenance operation
router.put('/:id/status', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const { status, technician_notes } = req.body;
  const state = db.getState();

  const op = state.maintenance.find(m => m.operation_id === id);
  if (!op) {
    return res.status(404).json({ error: 'Maintenance operation not found' });
  }

  if (status) op.request_status = status;
  if (technician_notes) op.technician_notes = technician_notes;
  if (status === 'Completed') {
    op.completed_date = new Date().toISOString().slice(0, 10);
    // Check if target can be restored to Available
    const remaining = state.maintenance.filter(m => m.target_id === op.target_id && m.request_status !== 'Completed');
    if (remaining.length === 0) {
      if (op.target_type === 'venue') {
        const v = state.venues.find(ven => ven.venue_id === op.target_id);
        if (v && v.status === 'Under Maintenance') v.status = 'Available';
      } else if (op.target_type === 'equipment') {
        const eq = state.equipment.find(e => e.asset_id === op.target_id);
        if (eq && eq.status === 'Under Maintenance') eq.status = 'Available';
      }
    }
  }

  res.json({ message: 'Maintenance status updated', operation: op });
});

export default router;
