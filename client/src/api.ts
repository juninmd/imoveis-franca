import axios from 'axios';
import type { ApiParsedResponse } from './types';

export type ImoveisQuery = Record<string, string | number | string[] | undefined>;

export const fetchImoveis = async (params: ImoveisQuery) => {
  const { data } = await axios.get<ApiParsedResponse>('/api/imoveis', { params });
  return data.data;
};
