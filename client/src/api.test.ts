import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { fetchImoveis } from './api';

vi.mock('axios');

describe('API Service', () => {
  it('fetchImoveis calls axios with correct params', async () => {
    const mockResponse = { data: { data: [{ id: 1, title: 'Casa' }] } };
    // @ts-expect-error Mocking axios
    axios.get.mockResolvedValue(mockResponse);

    const params = { minPrice: 1000 };
    const result = await fetchImoveis(params);

    expect(axios.get).toHaveBeenCalledWith('/api/imoveis', { params });
    expect(result).toEqual(mockResponse.data.data);
  });
});
