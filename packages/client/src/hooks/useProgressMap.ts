import { useQuery } from '@tanstack/react-query';
import { historyApi } from '../services/historyApi.js';

export function useProgressMap() {
  return useQuery({
    queryKey: ['progressMap'],
    queryFn: () => historyApi.getProgressMap(),
    staleTime: 30_000,
  });
}
