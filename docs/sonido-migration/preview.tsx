import '@juninmd/sonido/styles.css';
import './preview.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FilterX, Heart, LayoutGrid, List, Moon } from 'lucide-react';
import { Badge, Button, SearchField, Skeleton, Spinner, SubTabs, TextField } from '@juninmd/sonido';
import { FilterSidebar as CurrentFilterSidebar } from '../../client/src/components/FilterSidebar';
import { PropertyCard as CurrentPropertyCard } from '../../client/src/components/PropertyCard';
import { EmptyState as CurrentEmptyState } from '../../client/src/components/EmptyState';
import { ToastContext } from '../../client/src/components/ToastContext';
import type { Imovel } from '../../client/src/types';
import { FilterSidebar as LegacyFilterSidebar } from './legacy/FilterSidebar';
import { PropertyCard as LegacyPropertyCard } from './legacy/PropertyCard';
import { EmptyState as LegacyEmptyState } from './legacy/EmptyState';
import {
  LegacyAddressSearch,
  LegacyClearAll,
  LegacyPriceFields,
  LegacyTipoChips,
} from './legacy/FilterBits';
import {
  LegacyClearFilters,
  LegacyDarkToggle,
  LegacyFavoritesButton,
  LegacyFilterSkeleton,
  LegacyLoading,
  LegacyViewToggle,
} from './legacy/HomeChrome';

const theme = new URLSearchParams(window.location.search).get('theme') === 'light' ? 'light' : 'dark';
document.documentElement.classList.toggle('dark', theme === 'dark');
document.documentElement.dataset.theme = theme;

const filters = {
  tipo: 'venda' as const,
  minPrice: '250000',
  maxPrice: '600000',
  minBedrooms: '2',
  minBathrooms: '1',
  minVacancies: '1',
  minArea: '80',
  maxArea: '200',
  minAreaTotal: '',
  maxAreaTotal: '',
  address: ['Jardim das Acácias'],
  sites: ['imobiliaria-exemplo.com.br'],
  tipoImovel: ['casa'],
  q: 'quintal',
};

const addresses = ['Centro', 'Jardim das Acácias', 'Vila Nova Franca', 'Parque das Esmeraldas'];
const sites = ['imobiliaria-exemplo.com.br', 'outra-imobiliaria.invalid'];

const houseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#93c5fd"/><stop offset="1" stop-color="#1d4ed8"/>
    </linearGradient>
    <linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#4ade80"/><stop offset="1" stop-color="#15803d"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#sky)"/>
  <circle cx="660" cy="110" r="55" fill="#fde68a" opacity=".9"/>
  <rect y="420" width="800" height="180" fill="url(#lawn)"/>
  <path d="M220 430V260l180-120 180 120v170z" fill="#f8fafc"/>
  <path d="M190 270 400 120l210 150" fill="none" stroke="#0f172a" stroke-width="26" stroke-linecap="round"/>
  <rect x="320" y="330" width="70" height="100" rx="8" fill="#1e293b"/>
  <rect x="440" y="320" width="86" height="70" rx="8" fill="#bfdbfe" stroke="#1e293b" stroke-width="8"/>
  <path d="M483 320v70M440 355h86" stroke="#1e293b" stroke-width="6"/>
</svg>`;

const imovel: Imovel = {
  site: 'imobiliaria-exemplo.com.br',
  titulo: 'Casa térrea com quintal amplo e edícula',
  descricao: 'Imóvel fictício usado apenas na comparação visual dos componentes.',
  imagens: [`data:image/svg+xml,${encodeURIComponent(houseSvg)}`],
  endereco: 'Rua das Acácias, 120 - Jardim das Acácias, Franca/SP',
  valor: 485000,
  area: 128,
  areaTotal: 250,
  quartos: 3,
  banheiros: 2,
  vagas: 2,
  precoPorMetro: 3789,
  entrada: 0,
  valorMedioBairroPorAreaTotal: 1200000,
  tipo: 'venda',
  tipoImovel: 'Casa',
  link: 'https://exemplo.invalid/imovel/123',
};

const toastValue = {
  addToast: () => undefined,
  removeToast: () => undefined,
};

function Panel({
  tone,
  children,
  label,
  fixedHeight = false,
}: {
  tone: 'before' | 'after';
  children: React.ReactNode;
  label: string;
  fixedHeight?: boolean;
}) {
  return (
    <section
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border p-4 shadow-sm ${
        tone === 'before'
          ? 'border-amber-300/60 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-500/5'
          : 'border-blue-300/60 bg-blue-50/40 dark:border-blue-500/30 dark:bg-blue-500/5'
      }`}
    >
      <h3
        className={`mb-3 text-[11px] font-bold uppercase tracking-[0.12em] ${
          tone === 'before' ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'
        }`}
      >
        {label}
      </h3>
      <div className={fixedHeight ? 'min-h-0 flex-1 overflow-y-auto custom-scrollbar pr-1' : ''}>{children}</div>
    </section>
  );
}

function Pair({
  title,
  note,
  before,
  after,
  fixedHeight = false,
}: {
  title: string;
  note?: string;
  before: React.ReactNode;
  after: React.ReactNode;
  fixedHeight?: boolean;
}) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        {note && <p className="text-xs text-gray-500 dark:text-gray-400">{note}</p>}
      </div>
      <div
        className="grid grid-cols-2 gap-5"
        style={fixedHeight ? { height: 600 } : undefined}
      >
        <Panel tone="before" label="Antes · componente do imoveis-franca" fixedHeight={fixedHeight}>
          {before}
        </Panel>
        <Panel tone="after" label="Depois · @juninmd/sonido" fixedHeight={fixedHeight}>
          {after}
        </Panel>
      </div>
    </section>
  );
}

function App() {
  return (
    <main className="mx-auto max-w-[1080px] px-8 py-10">
      <header className="mb-10 flex items-end justify-between gap-6 border-b border-gray-200 pb-6 dark:border-gray-700">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            imoveis-franca · migração de UI
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Primitivas locais → @juninmd/sonido 2.4.0
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
            Lado a lado com o CSS real do app. Todos os dados são fictícios: bairro, rua, imobiliária, preço e
            anúncio não existem.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-300">
          tema {theme}
        </span>
      </header>

      <Pair
        title="Painel de filtros"
        note="Recorte com rolagem: o painel completo tem mais seções."
        fixedHeight
        before={
          <LegacyFilterSidebar
            filters={filters}
            setFilters={() => undefined}
            addresses={addresses}
            availableSites={sites}
          />
        }
        after={
          <CurrentFilterSidebar
            filters={filters}
            setFilters={() => undefined}
            addresses={addresses}
            availableSites={sites}
          />
        }
      />

      <Pair
        title="Campos e busca"
        note="TextField compacto e SearchField com botão de limpar nomeado."
        before={
          <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <LegacyPriceFields />
            <LegacyAddressSearch />
          </div>
        }
        after={
          <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-3">
              <TextField compact label="Mínimo" type="number" placeholder="0" defaultValue="250000" />
              <TextField compact label="Máximo" type="number" placeholder="Ilimitado" defaultValue="600000" />
            </div>
            <SearchField label="Filtrar bairros" clearLabel="Limpar busca de bairros" placeholder="Filtrar bairros..." value="Jardim" onChange={() => undefined} />
          </div>
        }
      />

      <Pair
        title="Chips e ação destrutiva"
        note="Botões xs/outline para chrome denso; perigo em outline para não competir com o CTA."
        before={
          <div className="space-y-5">
            <LegacyTipoChips />
            <LegacyClearAll />
          </div>
        }
        after={
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de imóvel">
              {['casa', 'apartamento', 'terreno', 'comercial'].map((tipo) => (
                <Button
                  key={tipo}
                  type="button"
                  aria-pressed={tipo === 'casa'}
                  variant={tipo === 'casa' ? 'primary' : 'secondary'}
                  appearance={tipo === 'casa' ? 'solid' : 'outline'}
                  size="xs"
                  className="capitalize"
                >
                  {tipo}
                </Button>
              ))}
            </div>
            <Button variant="danger" appearance="outline" size="md" className="w-full" iconStart={<FilterX size={16} />}>
              Limpar Todos os Filtros
            </Button>
          </div>
        }
      />

      <Pair
        title="Card do imóvel"
        note="Badge para status/contagem e Button como link no CTA; mesmo anúncio fictício nos dois lados."
        before={
          <ToastContext.Provider value={toastValue}>
            <LegacyPropertyCard imovel={imovel} isFavorite={false} onToggleFavorite={() => undefined} />
          </ToastContext.Provider>
        }
        after={
          <ToastContext.Provider value={toastValue}>
            <CurrentPropertyCard imovel={imovel} isFavorite={false} onToggleFavorite={() => undefined} />
          </ToastContext.Provider>
        }
      />

      <Pair
        title="Estado vazio"
        note="O card externo do app continua; título, ícone e ação vêm do EmptyState."
        before={
          <LegacyEmptyState
            title="Nenhum imóvel encontrado"
            description="Nenhum imóvel combina com os filtros atuais."
            tips={['Você tem 3 filtros ativos. Tente removê-los.', 'Tente aumentar o limite de preço máximo.']}
            action={{ label: 'Limpar Filtros', onClick: () => undefined }}
          />
        }
        after={
          <CurrentEmptyState
            title="Nenhum imóvel encontrado"
            description="Nenhum imóvel combina com os filtros atuais."
            tips={['Você tem 3 filtros ativos. Tente removê-los.', 'Tente aumentar o limite de preço máximo.']}
            action={{ label: 'Limpar Filtros', onClick: () => undefined }}
          />
        }
      />

      <Pair
        title="Chrome do cabeçalho"
        note="Button icon/xs/outline, Badge count, SubTabs de visualização, Spinner e Skeleton."
        before={
          <div className="space-y-4">
            <LegacyClearFilters count={3} />
            <div className="flex flex-wrap items-center gap-3">
              <LegacyFavoritesButton count={4} />
              <LegacyDarkToggle dark={theme === 'dark'} />
              <LegacyViewToggle viewMode="grid" />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <LegacyLoading />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <LegacyFilterSkeleton />
            </div>
          </div>
        }
        after={
          <div className="space-y-4">
            <Button variant="danger" appearance="outline" size="sm" className="w-full" iconStart={<FilterX size={16} />}>
              Limpar Filtros (3)
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" appearance="outline" size="sm" iconStart={<Heart size={16} />} aria-pressed={false}>
                Favoritos <Badge appearance="count">4</Badge>
              </Button>
              <Button variant="secondary" appearance="outline" size="icon" aria-label="Ativar modo escuro">
                <Moon size={20} />
              </Button>
              <SubTabs
                label="Modo de visualização"
                items={[
                  { key: 'grid', label: 'Visualização em grade', icon: <LayoutGrid size={18} /> },
                  { key: 'list', label: 'Visualização em lista', icon: <List size={18} /> },
                ]}
                value="grid"
                onChange={() => undefined}
                iconsOnly
              />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 font-medium text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400">
              <Spinner size={20} />
              Buscando imóveis...
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <Skeleton label="Carregando filtros" rows={5} />
            </div>
          </div>
        }
      />

      <footer className="border-t border-gray-200 pt-5 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Captura gerada com <code>docs/sonido-migration/preview.html</code> em Chromium 1180×900 (deviceScaleFactor 2,
        fullPage). Preços, endereços e nomes de imobiliária são inventados.
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
