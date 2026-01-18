
import express from 'express';
const router = express.Router();

import { UsersController } from './modules/users/users.controller';
import { ProductsController } from './modules/products/products.controller';
import { ReportsController } from './modules/reports/reports.controller';

// Test de Salud
router.get('/health', (req, res) => res.json({ status: 'ok', message: 'Backend Modular Operativo' }));

// Autenticación
router.post('/login', UsersController.login);

// Modulo Usuarios (Houses)
router.get('/users', UsersController.getAll);
router.put('/users/:id', UsersController.update);

// Modulo Productos (Fees)
router.get('/products', ProductsController.getAll);
router.post('/products', ProductsController.create);
router.put('/products/:id', ProductsController.update);
router.delete('/products/:id', ProductsController.delete);

// Modulo Reportes (Pagos, Gastos, Reuniones, Personal, Turnos, Logs)
router.get('/reports/payments', ReportsController.getPayments);
router.post('/reports/payments', ReportsController.createPayment);
router.delete('/reports/payments/:id', ReportsController.deletePayment);

router.get('/reports/expenses', ReportsController.getExpenses);
router.post('/reports/expenses', ReportsController.createExpense);
router.delete('/reports/expenses/:id', ReportsController.deleteExpense);

router.get('/reports/meetings', ReportsController.getMeetings);
router.post('/reports/meetings', ReportsController.createMeeting);
router.put('/reports/meetings/:id', ReportsController.updateMeeting);
router.delete('/reports/meetings/:id', ReportsController.deleteMeeting);

router.get('/reports/employees', ReportsController.getEmployees);
router.post('/reports/employees', ReportsController.createEmployee);
router.put('/reports/employees/:id', ReportsController.updateEmployee);

router.get('/reports/vacations', ReportsController.getVacations);
router.post('/reports/vacations', ReportsController.createVacation);
router.delete('/reports/vacations/:id', ReportsController.deleteVacation);

router.get('/reports/leaves', ReportsController.getLeaves);
router.post('/reports/leaves', ReportsController.createLeave);
router.delete('/reports/leaves/:id', ReportsController.deleteLeave);

router.get('/reports/shifts', ReportsController.getShifts);
router.post('/reports/shifts', ReportsController.saveShifts);
router.get('/reports/logs', ReportsController.getLogs);

export default router;