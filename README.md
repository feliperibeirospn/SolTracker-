# ☀️ SolTracker - Sistema de Gestão Solar Inteligente

O **SolTracker** é uma plataforma progressiva (PWA) de alto desempenho desenvolvida para facilitar o gerenciamento de clientes e faturamentos no setor de energia solar. Com foco em **soberania de dados** e **segurança máxima**, o sistema opera de forma local e híbrida, garantindo que o usuário tenha controle total sobre suas informações.

---

## 🚀 Principais Funcionalidades

### 📊 Dashboard Analítico
*   **Cards de Métricas**: Visualização instantânea de total de clientes, receita total, lucro líquido e saldos pendentes.
*   **Gráficos Inteligentes**: Comparativo mensal de **Receita Bruta vs Lucro Real** e status da carteira de clientes (Ativos vs Inadimplentes).

### 👥 Gestão de Clientes
*   **Cadastro Completo**: Nome, telefone, CPF, email, cidade, distribuidora e consumo médio.
*   **Regra de Desconto Variável**: Cada cliente pode possuir um percentual de desconto personalizado.
*   **Busca e Filtros**: Listagem dinâmica com pesquisa por nome/documento, ordenação e paginação.

### 💰 Módulo Financeiro
*   **Cálculo Automático**: O sistema calcula automaticamente o valor com desconto e o lucro líquido após abater as taxas das concessionárias.
*   **Gestão de Faturas**: Controle rigoroso de status (Pago, Pendente, Atrasado) com atualização automática de vencimentos.

### 📋 Relatórios e Exportação
*   **PDF Profissional**: Geração de relatórios formatados para arquivamento ou envio.
*   **Excel (XLSX)**: Exportação de dados estruturados para análises externas.
*   **Modo Impressão**: Layout limpo e otimizado para impressão direta.

### 📥 Importação de Dados
*   Suporte para importação em lote via **CSV** e **Excel**, permitindo migrar bases de dados existentes em segundos.

---

## 🛡️ Segurança e Privacidade (Padrão Bancário)

O SolTracker foi construído sob o princípio de **Privacy by Design**:

1.  **Armazenamento Local**: Seus dados ficam salvos no seu próprio navegador (IndexedDB). Ninguém tem acesso a eles pela internet.
2.  **Criptografia AES-256**: Todos os backups e comunicações com a nuvem são trancados com criptografia de nível militar.
3.  **Senha Mestre (SHA-256)**: O acesso ao sistema é protegido por uma senha mestre que nunca é salva em texto puro.
4.  **Isolamento Multi-usuário**: Backups na nuvem são isolados por uma chave única baseada em `Email + Senha`.

---

## ☁️ Backup Híbrido

*   **Local**: Exportação de arquivos `.sol` criptografados.
*   **Cloudflare KV**: Sincronização automática e resgate de dados em diferentes dispositivos via API Serverless.
*   **GitHub**: Integração opcional com repositórios privados para armazenamento de longo prazo.

---

## 🛠️ Tecnologias Utilizadas

*   **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite 8](https://vitejs.dev/)
*   **Banco de Dados**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
*   **Estado**: [Zustand](https://github.com/pmndrs/zustand)
*   **Gráficos**: [Recharts](https://recharts.org/)
*   **Estilização**: CSS Modules com variáveis dinâmicas (Solar Theme)
*   **PWA**: [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
*   **Segurança**: [CryptoJS](https://cryptojs.gitbook.io/docs/)
*   **Infra**: [Cloudflare Workers](https://workers.cloudflare.com/)

---

## 💻 Como Rodar o Projeto

1.  Clone o repositório.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
4.  Para gerar a build de produção:
    ```bash
    npm run build
    ```

---

Desenvolvido com ❤️ por [Felipe Ribeiro](https://github.com/feliperibeirospn).
