
import { supabase } from '../../commons/database';

// Función auxiliar para normalizar los datos de la casa desde Supabase al Frontend
const mapHouseFromDB = (h: any) => ({
  id: h.id,
  number: String(h.number || ''),
  ownerName: h.owner_name || h.ownerName || 'Sin Nombre',
  rut: h.rut || '',
  phone: h.phone || '',
  email: h.email || '',
  hasParking: h.has_parking ?? h.hasParking ?? false,
  residentType: h.resident_type ?? h.residentType ?? 'propietario',
  isBoardMember: h.is_board_member ?? h.isBoardMember ?? false
});

export const UsersController = {
  getAll: async (req: any, res: any) => {
    try {
      console.log('🔍 Consultando tabla "houses" en Supabase...');
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .order('number', { ascending: true });
      
      if (error) {
        console.error('❌ Error Supabase (houses):', error.message);
        throw error;
      }
      
      const mappedData = (data || []).map(mapHouseFromDB);
      console.log(`✅ Se encontraron ${mappedData.length} casas.`);
      res.json(mappedData);
    } catch (err: any) {
      console.error('❌ Error crítico en UsersController.getAll:', err.message);
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req: any, res: any) => {
    try {
      const { id: _, ...body } = req.body; // Extraemos el ID para no enviarlo en el payload de actualización
      const houseId = req.params.id;

      console.log(`🚀 Iniciando actualización para Casa ID: ${houseId}`);
      
      // Mapeo explícito de Frontend -> Database (snake_case)
      const updateData: any = {};
      
      if (body.number !== undefined) updateData.number = body.number;
      if (body.ownerName !== undefined) updateData.owner_name = body.ownerName;
      if (body.rut !== undefined) updateData.rut = body.rut;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.hasParking !== undefined) updateData.has_parking = body.hasParking;
      if (body.residentType !== undefined) updateData.resident_type = body.residentType;
      if (body.isBoardMember !== undefined) updateData.is_board_member = body.isBoardMember;

      console.log('📦 Datos a persistir:', updateData);

      const { data, error } = await supabase
        .from('houses')
        .update(updateData)
        .eq('id', houseId)
        .select();
      
      if (error) {
        console.error('❌ Error en actualización Supabase:', error.message);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No se encontró la casa o no hubo cambios.');
        return res.status(404).json({ message: 'Casa no encontrada' });
      }

      // Devolvemos el objeto mapeado correctamente al frontend
      const result = mapHouseFromDB(data[0]);
      console.log('✅ Casa actualizada con éxito:', result.number);
      res.json(result);
    } catch (err: any) {
      console.error('❌ Error crítico en UsersController.update:', err.message);
      res.status(500).json({ error: err.message });
    }
  },

  login: async (req: any, res: any) => {
    const emailInput = req.body.email ? req.body.email.trim().toLowerCase() : '';
    const passwordInput = req.body.password ? req.body.password.trim() : '';

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', emailInput)
        .eq('password', passwordInput)
        .maybeSingle();

      if (error) {
        console.error('❌ Error de conexión Supabase:', error.message);
        return res.status(500).json({ message: 'Error de conexión con la base de datos' });
      }

      if (!user) {
        console.warn(`⚠️ Intento de acceso fallido: ${emailInput}`);
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      console.log(`✅ Sesión iniciada: ${user.name} (${user.role})`);
      
      const { password: _, ...userProfile } = user;
      res.json(userProfile);

    } catch (err: any) {
      console.error('❌ Error crítico en Login:', err.message);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};
