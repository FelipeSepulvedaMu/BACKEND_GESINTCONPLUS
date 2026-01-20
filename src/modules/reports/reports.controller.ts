import { supabase } from '../../commons/database';
import nodemailer from 'nodemailer';

// --- CONFIGURACIÓN DE CORREO (SMTP) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// --- AYUDANTES DE MAPEO (BASE DE DATOS -> FRONTEND) ---

const mapPaymentFromDB = (p: any) => ({
  id: p.id,
  houseId: String(p.house_id || p.houseId || ''),
  year: Number(p.year),
  month: Number(p.month),
  payerName: p.payer_name || p.payerName || 'Sin Nombre',
  amount: Number(p.amount || 0),
  breakdown: Array.isArray(p.breakdown) ? p.breakdown : [],
  date: p.payment_date || p.date,
  receiver: p.receiver,
  voucherId: p.voucher_id || p.voucherId || '',
  type: p.payment_type || p.type || 'Abono / Pago Mensual'
});

const mapPaymentToDB = (p: any) => ({
  house_id: p.houseId,
  year: Number(p.year),
  month: Number(p.month),
  payer_name: p.payerName,
  amount: Number(p.amount),
  breakdown: p.breakdown, 
  payment_date: p.date,
  receiver: p.receiver,
  voucher_id: p.voucherId,
  payment_type: p.type
});

const mapMeetingFromDB = (m: any) => ({
  id: m.id,
  name: m.name || '',
  date: m.date || '',
  attendance: m.attendance || {},
  createdBy: m.created_by || m.createdBy,
  updatedBy: m.updated_by || m.updatedBy,
  createdAt: m.created_at || m.createdAt,
  updatedAt: m.updated_at || m.updatedAt
});

const mapMeetingToDB = (m: any) => ({
  name: m.name,
  date: m.date,
  attendance: m.attendance,
  created_by: m.createdBy,
  updated_by: m.updatedBy,
  created_at: m.createdAt,
  updated_at: m.updated_at
});

const mapEmployeeFromDB = (e: any) => ({
  id: e.id,
  name: e.name || '',
  rut: e.rut || '',
  entryDate: e.entry_date || e.entryDate || '',
  role: e.role || '',
  grossSalary: Number(e.gross_salary || e.grossSalary || 0),
  afpPercentage: Number(e.afp_percentage || e.afpPercentage || 0),
  fonasaPercentage: Number(e.fonasa_percentage || e.fonasaPercentage || 0),
  cesantiaPercentage: Number(e.cesantia_percentage || e.cesantiaPercentage || 0)
});

const mapEmployeeToDB = (e: any) => ({
  name: e.name,
  rut: e.rut,
  entry_date: e.entryDate,
  role: e.role,
  gross_salary: e.grossSalary,
  afp_percentage: e.afpPercentage,
  fonasa_percentage: e.fonasaPercentage,
  cesantia_percentage: e.cesantiaPercentage
});

const mapActivityFromDB = (a: any) => ({
  id: a.id,
  employeeId: a.employee_id || a.employeeId,
  startDate: a.start_date || a.startDate,
  endDate: a.end_date || a.endDate,
  days: Number(a.days || 0),
  status: a.status,
  type: a.type,
  createdAt: a.created_at || a.createdAt,
  createdBy: a.created_by || a.createdBy
});

const mapExpenseFromDB = (e: any) => ({
  id: e.id,
  year: Number(e.year),
  month: Number(e.month),
  description: e.description || '',
  amount: Number(e.amount || 0),
  category: e.category || 'General'
});

// --- CONTROLADOR PRINCIPAL ---

export const ReportsController = {
  // PAGOS
  getPayments: async (req: any, res: any) => {
    try {
      const { data, error } = await supabase.from('payments').select('*').order('payment_date', { ascending: false });
      if (error) throw error;
      res.json((data || []).map(mapPaymentFromDB));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  createPayment: async (req: any, res: any) => {
    try {
      const { shouldSendEmail, targetEmail, houseNumber, ...paymentData } = req.body;
      const dbPayload = mapPaymentToDB(paymentData);
      
      const { data, error } = await supabase.from('payments').insert([dbPayload]).select();
      if (error) throw error;
      
      const savedPayment = data ? mapPaymentFromDB(data[0]) : null;

      // Lógica de envío de correo SMTP (Solo si se solicita y hay credenciales)
      if (shouldSendEmail && targetEmail && savedPayment && process.env.EMAIL_USER) {
        const breakdownText = savedPayment.breakdown
          .map((item: any) => ` - ${item.name.toUpperCase()}: $${Number(item.amount).toLocaleString()}`)
          .join('\n');

        const mailOptions = {
          from: `"Administración CondoMaster" <${process.env.EMAIL_USER}>`,
          to: targetEmail,
          subject: `Comprobante Casa ${houseNumber || ''} - Folio #${savedPayment.voucherId}`,
          text: `Estimado(a) ${savedPayment.payerName},\n\nSe ha registrado su pago periodo ${MONTH_NAMES[savedPayment.month]} ${savedPayment.year}.\n\nFolio: #${savedPayment.voucherId}\nTotal: $${savedPayment.amount.toLocaleString()}\n\nDetalle desglosado:\n${breakdownText}\n\nGracias por su compromiso.\nAtentamente,\nCondoMaster ERP Cloud.`
        };

        transporter.sendMail(mailOptions).catch((e: Error) => console.error("❌ Error SMTP:", e.message));
      }

      res.json(savedPayment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  deletePayment: async (req: any, res: any) => {
    try {
      const { error } = await supabase.from('payments').delete().eq('id', req.params.id);
      if (error) throw error;
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // GASTOS
  getExpenses: async (req: any, res: any) => {
    try {
      const { data, error } = await supabase.from('expenses').select('*').order('year', { ascending: false }).order('month', { ascending: false });
      if (error) throw error;
      res.json((data || []).map(mapExpenseFromDB));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  createExpense: async (req: any, res: any) => {
    try {
      const { description, amount, category, year, month } = req.body;
      const dbPayload = {
        description: String(description || '').trim(),
        amount: parseFloat(amount || 0),
        category: String(category || 'General').trim(),
        year: parseInt(year),
        month: parseInt(month)
      };
      const { data, error } = await supabase.from('expenses').insert([dbPayload]).select();
      if (error) throw error;
      res.json(mapExpenseFromDB(data[0]));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteExpense: async (req: any, res: any) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', req.params.id);
      if (error) throw error;
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // REUNIONES
  getMeetings: async (req: any, res: any) => {
    try {
      const { data, error } = await supabase.from('meetings').select('*').order('date', { ascending: false });
      if (error) throw error;
      res.json((data || []).map(mapMeetingFromDB));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  createMeeting: async (req: any, res: any) => {
    try {
      const dbPayload = mapMeetingToDB(req.body);
      const { data, error } = await supabase.from('meetings').insert([dbPayload]).select();
      if (error) throw error;
      res.json(data ? mapMeetingFromDB(data[0]) : null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  updateMeeting: async (req: any, res: any) => {
    try {
      const dbPayload = mapMeetingToDB(req.body);
      const { data, error } = await supabase.from('meetings').update(dbPayload).eq('id', req.params.id).select();
      if (error) throw error;
      res.json(data ? mapMeetingFromDB(data[0]) : null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteMeeting: async (req: any, res: any) => {
    try {
      const { error } = await supabase.from('meetings').delete().eq('id', req.params.id);
      if (error) throw error;
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // EMPLEADOS
  getEmployees: async (req: any, res: any) => {
    try {
      const { data, error } = await supabase.from('employees').select('*').order('name', { ascending: true });
      if (error) throw error;
      res.json((data || []).map(mapEmployeeFromDB));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  createEmployee: async (req: any, res: any) => {
    try {
      const dbPayload = mapEmployeeToDB(req.body);
      const { data, error } = await supabase.from('employees').insert([dbPayload]).select();
      if (error) throw error;
      res.json(data ? mapEmployeeFromDB(data[0]) : null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  updateEmployee: async (req: any, res: any) => {
    try {
      const dbPayload = mapEmployeeToDB(req.body);
      const { data, error } = await supabase.from('employees').update(dbPayload).eq('id', req.params.id).select();
      if (error) throw error;
      res.json(data ? mapEmployeeFromDB(data[0]) : null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // VACACIONES (TABLA vacation_requests)
  getVacations: async (req: any, res: any) => {
    try {
      const { data, error } = await supabase.from('vacation_requests').select('*').order('start_date', { ascending: false });
      if (error) throw error;
      res.json((data || []).map(mapActivityFromDB));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  createVacation: async (req: any, res: any) => {
    try {
      const dbPayload = {
        employee_id: req.body.employeeId,
        start_date: req.body.startDate,
        end_date: req.body.endDate,
        days: Number(req.body.days || 0),
        status: req.body.status || 'approved',
        created_by: req.body.createdBy
      };
      const { data, error } = await supabase.from('vacation_requests').insert([dbPayload]).select();
      if (error) throw error;
      res.json(data ? mapActivityFromDB(data[0]) : null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteVacation: async (req: any, res: any) => {
    try {
      const { error } = await supabase.from('vacation_requests').delete().eq('id', req.params.id);
      if (error) throw error;
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // LICENCIAS (TABLA medical_leaves)
  getLeaves: async (req: any, res: any) => {
    try {
      const { data, error } = await supabase.from('medical_leaves').select('*').order('start_date', { ascending: false });
      if (error) throw error;
      res.json((data || []).map(mapActivityFromDB));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  createLeave: async (req: any, res: any) => {
    try {
      const dbPayload = {
        employee_id: req.body.employeeId,
        start_date: req.body.startDate,
        end_date: req.body.endDate,
        days: Number(req.body.days || 0),
        type: req.body.type || 'medical',
        created_by: req.body.createdBy
      };
      const { data, error } = await supabase.from('medical_leaves').insert([dbPayload]).select();
      if (error) throw error;
      res.json(data ? mapActivityFromDB(data[0]) : null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteLeave: async (req: any, res: any) => {
    try {
      const { error } = await supabase.from('medical_leaves').delete().eq('id', req.params.id);
      if (error) throw error;
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // TURNOS (TABLA shift_schedules)
  getShifts: async (req: any, res: any) => {
    try {
      const { startDate } = req.query;
      let query = supabase.from('shift_schedules').select('*');
      if (startDate) {
        query = query.eq('start_date', startDate);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      res.json(data ? data.assignments : {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  saveShifts: async (req: any, res: any) => {
    try {
      const { startDate, assignments } = req.body;
      
      // Buscamos si ya existe una planificación para esa fecha específica
      const { data: existing, error: findError } = await supabase
        .from('shift_schedules')
        .select('id')
        .eq('start_date', startDate)
        .maybeSingle();
      
      if (findError) throw findError;

      let result;
      if (existing) {
        // Actualizamos la quincena existente
        result = await supabase
          .from('shift_schedules')
          .update({ assignments })
          .eq('id', existing.id)
          .select();
      } else {
        // Creamos una nueva planificación para este periodo
        result = await supabase
          .from('shift_schedules')
          .insert([{ start_date: startDate, assignments }])
          .select();
      }

      if (result.error) throw result.error;
      res.json({ success: true });
    } catch (err: any) {
      console.error('❌ Error guardando turnos:', err.message);
      res.status(500).json({ error: err.message });
    }
  },

  // LOGS (TABLA action_logs)
  getLogs: async (req: any, res: any) => {
    try {
      const { employeeId } = req.query;
      let query = supabase.from('action_logs').select('*').order('timestamp', { ascending: false });
      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }
      const { data, error } = await query;
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
