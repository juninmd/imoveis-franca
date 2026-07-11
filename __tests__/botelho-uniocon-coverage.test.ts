import botelho from '../src/sites/botelhoimobiliaria';
import uniocon from '../src/sites/unioconimobiliaria';

describe('Coverage tests', () => {
    it('should hit empty inputs', async () => {
        const bot = await botelho.adapter('');
        expect(bot.imoveis).toHaveLength(0);

        const uni = await uniocon.adapter('');
        expect(uni.imoveis).toHaveLength(0);

        // Edge cases botelho adapter branches
        const mockBot = `<div class="group"><h4 class="font-black">T1</h4><span class="material-symbols-outlined">location_on</span></div>`;
        await botelho.adapter(mockBot);

        const mockBot2 = `<div class="group"><div class="font-black"></div></div>`;
        await botelho.adapter(mockBot2);

        // Uniocon adapter
        const mockUni = `<imobzi-property-card><h3>Title - Bairro</h3><div>bed 1</div></imobzi-property-card>`;
        await uniocon.adapter(mockUni);
    });
});
