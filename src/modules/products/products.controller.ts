
import { supabase } from '../../commons/database';

// Función auxiliar para mapear de DB (snake_case) a Frontend (camelCase)
const mapFromDB = (f: any) => ({
  id: f.id,
  name: f.name || '',
  defaultAmount: f.default_amount ?? f.defaultAmount ?? 0,
  startMonth: f.start_month ?? f.startMonth ?? 0,
  startYear: f.start_year ?? f.startYear ?? 2024,
  endMonth: f.end_month ?? f.endMonth ?? undefined,
  endYear: f.end_year ?? f.endYear ?? undefined,
  applicableMonths: f.applicable_months ?? f.applicableMonths ?? null,
  category: f.category || 'monthly',
  targetHouseIds: f.target_house_ids ?? f.targetHouseIds ?? null
});

// Función auxiliar para mapear de Frontend (camelCase) a DB (snake_case)
const mapToDB = (f: any) => {
  const data: any = {};
  if (f.name !== undefined) data.name = f.name;
  if (f.defaultAmount !== undefined) data.default_amount = f.defaultAmount;
  if (f.startMonth !== undefined) data.start_month = f.startMonth;
  if (f.startYear !== undefined) data.start_year = f.startYear;
  if (f.endMonth !== undefined) data.end_month = f.endMonth;
  if (f.endYear !== undefined) data.end_year = f.endYear;
  if (f.applicableMonths !== undefined) data.applicable_months = f.applicableMonths;
  if (f.category !== undefined) data.category = f.category;
  if (f.targetHouseIds !== undefined) data.target_house_ids = f.targetHouseIds;
  return data;
};

export const ProductsController = {
  getAll: async (req: any, res: any) => {
    try {
      console.log('🔍 Consultando tabla "fees_config" en Supabase...');
      const { data, error } = await supabase.from('fees_config').select('*').order('name', { ascending: true });
      if (error) {
        console.error('❌ Error Supabase (fees_config):', error.message);
        throw error;
      }
      
      const mappedData = (data || []).map(mapFromDB);
      console.log(`✅ Se encontraron ${mappedData.length} configuraciones de cobro.`);
      res.json(mappedData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  create: async (req: any, res: any) => {
    try {
      const dbPayload = mapToDB(req.body);
      console.log('🚀 Creando nuevo cobro con payload:', dbPayload);
      
      const { data, error } = await supabase.from('fees_config').insert([dbPayload]).select();
      if (error) {
        console.error('❌ Error al insertar en fees_config:', error.message);
        throw error;
      }
      
      const result = data ? mapFromDB(data[0]) : null;
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req: any, res: any) => {
    try {
      const dbPayload = mapToDB(req.body);
      const { data, error } = await supabase
        .from('fees_config')
        .update(dbPayload)
        .eq('id', req.params.id)
        .select();
        
      if (error) throw error;
      const result = data ? mapFromDB(data[0]) : null;
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req: any, res: any) => {
    try {
      const { error } = await supabase.from('fees_config').delete().eq('id', req.params.id);
      if (error) throw error;
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
