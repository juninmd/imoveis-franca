import axios from 'axios';
import type { ApiParsedResponse } from './types';

export const fetchImoveis = async (params: Record<string, any>) => {
  const { data } = await axios.get<ApiParsedResponse>('/api/imoveis', { params });
  return data.data;
};
