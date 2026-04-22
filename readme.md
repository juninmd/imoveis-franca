# 🏠 Imóveis Franca

> A plataforma definitiva para encontrar o seu novo lar em Franca e região.

[![Deployment Status](https://img.shields.io/badge/ArgoCD-Synced-success?style=for-the-badge&logo=argocd)](https://argocd.antonio-code.duckdns.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

## 📝 Descrição

O **Imóveis Franca** é um portal imobiliário moderno que conecta compradores e vendedores. Com uma interface intuitiva e busca avançada, facilitamos a jornada de quem busca morar bem no interior de São Paulo.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/) + [Vite](https://vite.dev/)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Deployment**: Nginx + Docker

## 🚀 Como Rodar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/juninmd/imoveis-franca.git
   ```
2. Instale as dependências:
   ```bash
   pnpm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   pnpm dev
   ```

## 📦 Deployment

Este projeto é servido via **Nginx** em um cluster **K3s**.

- **URL de Produção**: [https://imoveis.antonio-code.duckdns.org](https://imoveis.antonio-code.duckdns.org)
