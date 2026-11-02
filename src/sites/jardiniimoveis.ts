import { buildProjetiveSite } from './platforms/projetive';

// Tenant Projetive: a API recusa a requisicao ("Site nao encontrado") sem o x-tenant-host do site.
export default buildProjetiveSite({ base: 'https://jardiniimoveis.com.br', name: 'jardiniimoveis.com.br', tenantHost: 'jardini-site.projetive.com.br' });
