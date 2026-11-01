import { sites } from '../src/sites';
import axios from 'axios';

async function test(domain: string) {
    const site = sites.find(s => s.name === domain);
    if (!site) {
        console.error('Site not found');
        return;
    }

    try {
        const { data } = await axios.get(site.url, site.axiosConfig || {});
        const { imoveis, qtd } = await site.adapter(data as string);
        console.log(`Found ${qtd} properties. Extracted ${imoveis.length} on this page.`);
        if (imoveis.length > 0) {
            console.log('Sample property:');
            console.log(imoveis[0]);
        }
    } catch (e) {
        console.error(e);
    }
}

test(process.argv[2]);
