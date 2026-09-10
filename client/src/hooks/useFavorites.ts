import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Imovel } from '../types';

const STORAGE_KEY = 'favorites:v2';
const LEGACY_KEY = 'favorites';

type FavoriteStore = Record<string, Imovel | null>;

const readStore = (): FavoriteStore => {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      return JSON.parse(current) as FavoriteStore;
    }
    // Migração da v1 (só uma lista de links): mantém o coração marcado; os dados do anúncio
    // são preenchidos assim que ele aparecer numa busca (ver `sync`).
    const legacy = localStorage.getItem(LEGACY_KEY);
    const links: string[] = legacy ? JSON.parse(legacy) : [];
    return Object.fromEntries(links.filter(link => typeof link === 'string').map(link => [link, null]));
  } catch {
    return {};
  }
};

/**
 * Favoritos com snapshot do anúncio.
 *
 * Antes só guardávamos o link e a lista de favoritos era filtrada a partir do resultado da
 * busca atual: trocar de "Comprar" para "Alugar" (ou mexer em qualquer filtro) fazia os
 * favoritos sumirem da tela enquanto o contador continuava mostrando o total.
 */
export const useFavorites = () => {
  const [store, setStore] = useState<FavoriteStore>(readStore);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Quota cheia ou storage bloqueado: manter os favoritos só em memória é melhor do que
      // derrubar a renderização.
    }
  }, [store]);

  const isFavorite = useCallback((link: string) => link in store, [store]);

  /** Devolve `true` quando o imóvel passou a ser favorito, `false` quando foi removido. */
  const toggle = useCallback((imovel: Imovel): boolean => {
    const added = !(imovel.link in store);
    setStore(prev => {
      const next = { ...prev };
      if (added) {
        next[imovel.link] = imovel;
      } else {
        delete next[imovel.link];
      }
      return next;
    });
    return added;
  }, [store]);

  // Completa os favoritos migrados da v1 com os dados do anúncio quando ele reaparece.
  const sync = useCallback((imoveis: Imovel[]) => {
    setStore(prev => {
      let changed = false;
      const next = { ...prev };
      for (const imovel of imoveis) {
        if (imovel.link in next && next[imovel.link] === null) {
          next[imovel.link] = imovel;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const items = useMemo(
    () => Object.values(store).filter((imovel): imovel is Imovel => imovel !== null),
    [store],
  );

  return { isFavorite, toggle, sync, items, count: Object.keys(store).length };
};
