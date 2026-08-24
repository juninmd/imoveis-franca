import { adapter } from '../src/sites/matriz';

describe('Matriz.site Adapter', () => {
  it('should parse HTML correctly', async () => {
    const html = `
      <p id="contadorTotal"><span id="contadorNumero">36</span> propriedades compatíveis disponíveis em nosso ecossistema.</p>
      <div class="bento-card flex flex-col relative overflow-hidden group card-animate" data-codigo="1585">
        <a href="https://matriz.site/imovel/1585?finalidade=Venda%3F" class="absolute inset-0 z-10 block"></a>
        <div class="h-64 relative bg-surface img-zone overflow-hidden">
          <img src="https://cdn.vistahost.com.br/matrizco/vista.imobi/fotos/1585/iu04G2El52i_158562a248bf7d6a4.jpg" class="w-full h-full object-cover" alt="Residência" loading="lazy">
        </div>
        <div class="p-5 md:p-6 flex flex-col flex-1">
          <div class="mb-4 flex items-start justify-between gap-2 border-b border-border-subtle pb-4">
            <div>
              <h4 class="font-serif text-xl md:text-2xl text-primary">Jardim Santana</h4>
              <span class="inline-block mt-1 text-[10px] uppercase font-bold text-electric-blue tracking-widest">Apartamento</span>
            </div>
            <span class="px-3 py-1.5 rounded-xl">Cód: 1585</span>
          </div>
          <div class="mb-4">
            <p class="text-electric-blue font-semibold tracking-widest leading-tight text-xl mb-1">R$ 2.100.000,00 <span class="text-[10px] text-secondary uppercase">Venda</span></p>
            <p class="text-electric-gold font-semibold tracking-widest leading-tight text-base">R$ 7.000,00 <span class="text-[10px] text-secondary uppercase">/Mês</span></p>
          </div>
          <div class='grid grid-cols-3 gap-2 mt-auto text-center border-t border-border-subtle pt-4'>
            <div class='flex flex-col justify-center min-w-0'>
              <span class='text-secondary text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold truncate'>Dormitórios</span>
              <span class='text-primary text-sm sm:text-base font-medium truncate mt-0.5'>3 Qts (3 St)</span>
            </div>
            <div class='flex flex-col justify-center border-l border-border-subtle pl-1 min-w-0'>
              <span class='text-secondary text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold truncate'>Vagas</span>
              <span class='text-primary text-sm sm:text-base font-medium truncate mt-0.5'>5 vagas</span>
            </div>
            <div class='flex flex-col justify-center border-l border-border-subtle pl-1 min-w-0'>
              <span class='text-secondary text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold truncate'>Área</span>
              <span class='text-primary text-sm sm:text-base font-medium truncate mt-0.5'>438 m²</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(36);
    expect(result.imoveis).toHaveLength(1);
    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('Jardim Santana');
    expect(imovel.endereco).toBe('JARDIM SANTANA');
    expect(imovel.valor).toBe(2100000);
    expect(imovel.area).toBe(438);
    expect(imovel.quartos).toBe(3);
    expect(imovel.banheiros).toBe(3);
    expect(imovel.vagas).toBe(5);
    expect(imovel.link).toBe('https://matriz.site/imovel/1585?finalidade=Venda%3F');
    expect(imovel.imagens).toEqual(['https://cdn.vistahost.com.br/matrizco/vista.imobi/fotos/1585/iu04G2El52i_158562a248bf7d6a4.jpg']);
  });

  it('should return no imoveis when there are no cards', async () => {
    const html = `
      <p id="contadorTotal"><span id="contadorNumero">0</span> propriedades compatíveis disponíveis em nosso ecossistema.</p>
      <div class="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 py-20 px-8 text-center bg-surface/40 rounded-3xl border border-border-subtle">
        <h3 class="font-serif text-2xl text-primary mb-4">Nenhum Imóvel Encontrado</h3>
        <p class="text-secondary font-light max-w-sm mx-auto mb-6">Não encontramos imóveis com este filtro específico. Tente ajustar sua busca.</p>
      </div>
    `;

    const result = await adapter(html);
    expect(result.qtd).toBe(0);
    expect(result.imoveis).toEqual([]);
  });
});
