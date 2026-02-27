import { supabase } from '@/lib/customSupabaseClient';
import { logInfo, logError } from '@/lib/logger';

export const generateRZJobId = async () => {
  const year = new Date().getFullYear();
  logInfo('RZJobIdGen', `Generating ID for year ${year}`);
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('rz_job_id')
      .like('rz_job_id', `RZ-JOB-${year}-%`)
      .order('rz_job_id', { ascending: false })
      .limit(1);

    if (error) {
      logError('RZJobIdGen', 'Failed to fetch latest RZ Job ID', error);
      throw error;
    }

    let nextNum = 1;
    if (data && data.length > 0 && data[0].rz_job_id) {
      const lastId = data[0].rz_job_id;
      const parts = lastId.split('-');
      if (parts.length === 4) {
        nextNum = parseInt(parts[3], 10) + 1;
      }
    }

    const newId = `RZ-JOB-${year}-${nextNum.toString().padStart(3, '0')}`;
    logInfo('RZJobIdGen', `Generated new ID: ${newId}`);
    return newId;
  } catch (error) {
    logError('RZJobIdGen', 'Exception in generateRZJobId', error);
    throw error;
  }
};