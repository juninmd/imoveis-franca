require('ts-node').register({ transpileOnly: true });
const { adapter } = require('./src/sites/cidadenovaimoveis');
const html = `
<a href="/imovel/123">
  <div class="property-card">
    <img src="/img.jpg" />
    <h2>Casa Legal</h2>
    <div class="content">Centro, Franca</div>
    <h3>R$ 500.000,00</h3>
    <div class="icons">100m2 3 2 4 2</div>
  </div>
</a>
`;
adapter(html).then(res => console.log(res.imoveis[0].quartos, res.imoveis[0].suites));
