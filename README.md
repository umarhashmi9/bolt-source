# bolt.diy (Anteriormente oTToDev)

[![bolt.diy: Desenvolvimento Web Full-Stack com IA no Navegador](./public/social_preview_index.jpg)](https://bolt.diy)

Bem-vindo ao **bolt.diy**, a versão open source oficial do **Bolt.new** (anteriormente conhecido como **oTToDev** e **bolt.new ANY LLM**), que permite escolher o modelo LLM que você deseja usar para cada prompt! Atualmente, você pode utilizar modelos da **OpenAI**, **Anthropic**, **Ollama**, **OpenRouter**, **Gemini**, **LMStudio**, **Mistral**, **xAI**, **HuggingFace**, **DeepSeek** ou **Groq** – e é facilmente extensível para usar qualquer outro modelo suportado pelo **Vercel AI SDK**! Veja as instruções abaixo para executar localmente e estender o suporte a mais modelos.

-----

Confira a [Documentação do bolt.diy](https://stackblitz-labs.github.io/bolt.diy/) para instruções de instalação oficiais e mais informações.

-----

Além disso, [este post fixado na nossa comunidade](https://thinktank.ottomator.ai/t/videos-tutorial-helpful-content/3243) tem diversos recursos incríveis para você executar e implantar o bolt.diy!

Também lançamos um agente experimental chamado **"bolt.diy Expert"** que pode responder a perguntas comuns sobre o bolt.diy. Encontre-o no [oTTomator Live Agent Studio](https://studio.ottomator.ai/).

O bolt.diy foi iniciado por [Cole Medin](https://www.youtube.com/@ColeMedin), mas rapidamente se tornou um esforço comunitário para construir o **melhor assistente de codificação com IA de código aberto**!

## Sumário

- [Junte-se à Comunidade](#junte-se-à-comunidade)
- [Adições Solicitadas](#adições-solicitadas)
- [Recursos](#recursos)
- [Configuração](#configuração)
- [Executar a Aplicação](#executar-a-aplicação)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Contribuindo](#contribuindo)
- [Roadmap](#roadmap)
- [Perguntas Frequentes](#perguntas-frequentes)

## Junte-se à Comunidade

[Participe da comunidade bolt.diy aqui, no oTTomator Think Tank!](https://thinktank.ottomator.ai)

## Gerenciamento de Projetos

O **bolt.diy** é um esforço colaborativo! Ainda assim, a equipe central de contribuidores organiza o projeto de forma que você entenda as áreas de foco atuais.

Se você quer saber no que estamos trabalhando, o que planejamos ou deseja contribuir com o projeto, confira o [guia de gerenciamento de projetos](./PROJECT.md) para começar facilmente.

## Adições Solicitadas

- ✅ Integração com OpenRouter (@coleam00)
- ✅ Integração com Gemini (@jonathands)
- ✅ Geração automática de modelos Ollama a partir do que for baixado (@yunatamos)
- ✅ Filtro de modelos por provedor (@jasonm23)
- ✅ Download de projetos como ZIP (@fabwaseem)
- ✅ Melhorias no prompt principal em `app\lib\.server\llm\prompts.ts` (@kofi-bhr)
- ✅ Integração com DeepSeek API (@zenith110)
- ✅ Integração com Mistral API (@ArulGandhi)
- ✅ Integração com API "Open AI Like" (@ZerxZ)
- ✅ Sincronização de arquivos para pasta local (@muzafferkadir)
- ✅ Containerização da aplicação com Docker (@aaronbolton)
- ✅ Publicação de projetos diretamente no GitHub (@goncaloalves)
- ✅ Inserção de chaves de API pela interface (@ali00209)
- ✅ Integração com xAI Grok Beta (@milutinke)
- ✅ Integração com LM Studio (@karrot0)
- ✅ Integração com HuggingFace (@ahsan3219)
- ✅ Terminal do Bolt para visualizar saída de comandos LLM (@thecodacus)
- ✅ Streaming de saída de código (@thecodacus)
- ✅ Capacidade de reverter código para versões anteriores (@wonderwhy-er)
- ✅ Backup e restauração do histórico de conversas (@sidbetatester)
- ✅ Integração com Cohere (@hasanraiyan)
- ✅ Definição dinâmica do comprimento máximo de tokens (@hasanraiyan)
- ✅ Melhorias nos prompts (@SujalXplores)
- ✅ Cache de prompts (@SujalXplores)
- ✅ Carregamento de projetos locais no app (@wonderwhy-er)
- ✅ Integração com Together (@mouimet-infinisoft)
- ✅ Suporte para dispositivos móveis (@qwikode)
- ✅ Anexar imagens aos prompts (@atrokhym, @stijnus)
- ✅ Botão de clonagem do Git (@thecodacus)
- ✅ Importação do Git por URL (@thecodacus)
- ✅ Biblioteca de Prompts para diversos casos de uso (@thecodacus)
- ✅ Detecção de erros no terminal e sugestão de correção pelo Bolt (@thecodacus)
- ✅ Detecção de erros no preview e sugestão de correção (@wonderwhy-er)
- ✅ Opções de modelos iniciais (@thecodacus)
- ✅ Ferramenta de seleção para alterações visuais (@emcconnell)
- ✅ Integração com Perplexity (@meetpateltech)
- ✅ Integração com AWS Bedrock (@kunjabijukchhe)
- ⬜ **Alta Prioridade** - Evitar que o Bolt reescreva arquivos com frequência (bloqueio de arquivos e diffs)
- ⬜ **Alta Prioridade** - Melhorar prompts para LLMs menores (janela de código não inicia)
- ⬜ **Alta Prioridade** - Executar agentes no backend ao invés de uma única chamada de modelo
- ⬜ Implantar diretamente em plataformas como Vercel/Netlify
- ⬜ Planejamento de projetos em arquivo MD para maior transparência
- ⬜ Integração com VSCode com confirmações similares ao Git
- ⬜ Upload de documentos para referência de estilo e design
- ⬜ Prompts por comando de voz
- ⬜ Integração com Azure Open AI API
- ⬜ Integração com Vertex AI
- ⬜ Integração com Granite
- ✅ Janela pop-up para o Web Container (@stijnus)
- ✅ Ajuste de tamanho da janela pop-up (@stijnus)

## Recursos

- **Desenvolvimento Web Full-Stack com IA** para aplicações **NodeJS** diretamente no navegador.
- **Suporte a múltiplos LLMs** com arquitetura extensível para integração de novos modelos.
- **Anexar imagens aos prompts** para melhor compreensão contextual.
- **Terminal integrado** para visualizar saídas de comandos LLM.
- **Reversão de código para versões anteriores** facilitando o debug.
- **Download de projetos como ZIP** para portabilidade.
- **Suporte a Docker** para instalação simplificada.

## Configuração

Se você é novo em instalação de software pelo GitHub, não se preocupe! Se encontrar problemas, envie uma "issue" pelos links fornecidos ou melhore esta documentação fazendo um fork do repositório, editando as instruções e enviando um pull request. As instruções abaixo ajudarão a configurar a versão estável do Bolt.DIY no seu computador local rapidamente.

Vamos colocar a versão estável do Bolt.DIY para rodar!

## Download Rápido

[![Baixar Última Versão](https://img.shields.io/github/v/release/stackblitz-labs/bolt.diy?label=Download%20Bolt&sort=semver)](https://github.com/stackblitz-labs/bolt.diy/releases/latest) ← Clique aqui para acessar a versão mais recente!

- Em seguida, **clique em source.zip**
## Pré-requisitos

Antes de começar, você precisará instalar dois softwares importantes:

### Instalar Node.js

O Node.js é necessário para executar a aplicação.

1. Visite a [Página de Download do Node.js](https://nodejs.org/en/download/)
2. Baixe a versão "LTS" (Long Term Support) para seu sistema operacional
3. Execute o instalador, aceitando as configurações padrão
4. Verifique se o Node.js foi instalado corretamente:
   - **Para Usuários Windows**:
     1. Pressione `Windows + R`
     2. Digite "sysdm.cpl" e pressione Enter
     3. Vá na aba "Avançado" → "Variáveis de Ambiente"
     4. Verifique se `Node.js` aparece na variável "Path"
   - **Para Usuários Mac/Linux**:
     1. Abra o Terminal
     2. Digite o comando:
        ```bash
        echo $PATH
        ```
     3. Procure por `/usr/local/bin` no resultado

## Executando a Aplicação

Você tem duas opções para executar o Bolt.DIY: diretamente na sua máquina ou usando Docker.

### Opção 1: Instalação Direta (Recomendada para Iniciantes)

1. **Instalar o Gerenciador de Pacotes (pnpm)**:

   ```bash
   npm install -g pnpm
   ```

2. **Instalar Dependências do Projeto**:

   ```bash
   pnpm install
   ```

3. **Iniciar a Aplicação**:

   ```bash
   pnpm run dev
   ```

   **Nota Importante**: Se você estiver usando Google Chrome, precisará do Chrome Canary para desenvolvimento local. [Baixe aqui](https://www.google.com/chrome/canary/)

#### Opção 2: Usando Docker

Essa opção exige familiaridade com Docker, mas oferece um ambiente mais isolado.

#### Pré-requisito Adicional

Instale o Docker: Baixar Docker

#### Passos:

1. **Construir a Imagem do Docker**:

   ```bash
   # Usando script npm:
   npm run dockerbuild

   # OU usando comando Docker direto:
   docker build . --target bolt-ai-development
   ```

2. **Executar o Container**:
   ```bash
   docker compose --profile development up
   ```

## Configurando Chaves de API e Provedores

### Adicionando Suas Chaves de API

Configurar suas chaves de API no Bolt.DIY é simples:

1. Abra a página inicial (interface principal)
2. Selecione seu provedor desejado no menu suspenso
3. Clique no ícone de lápiz (editar)
4. Insira sua chave de API no campo de entrada seguro

![Interface de Configuração de Chaves de API](./docs/images/api-key-ui-section.png)

### Configurando URLs Base Personalizadas

Para provedores que suportam URLs base personalizadas (como Ollama ou LM Studio), siga estes passos:

1. Clique no bot o de configuração na barra lateral para abrir o menu de configuração
   ![Localiza o do Bot o de Configuração](./docs/images/bolt-settings-button.png)

2. Navegue até a aba "Provedores"
3. Procure seu provedor usando a barra de pesquisa
4. Insira sua URL base personalizada no campo designado
   ![Configuração de URL Base do Provedor](./docs/images/provider-base-url.png)

> **Nota**: URLs base personalizadas são particularmente úteis quando se executa instância local de modelos de IA ou se usam endpoints de API personalizados.

### Provedores Suportados

- Ollama
- LM Studio
- OpenAILike

## Configuração Usando Git (Só para Desenvolvedores)

Este método é recomendado para desenvolvedores que desejam:

- Contribuir para o projeto
- Manter-se atualizado com as últimas alterações
- Alternar entre diferentes versões
- Criar modificações personalizadas

#### Pré-requisitos

1. Instale o Git: [Baixar Git](https://git-scm.com/downloads)

#### Configuração Inicial

1. **Clonar o Repositório**:

   ```bash
   # Usando HTTPS
   git clone https://github.com/stackblitz-labs/bolt.diy.git
   ```

2. **Navegue até o Diretório do Projeto**:

   ```bash
   cd bolt.diy
   ```

3. **Mudar para o Branch Principal**:
   ```bash
   git checkout main
   ```
4. **Instalar Dependências**:

   ```bash
   pnpm install
   ```

5. **Iniciar o Servidor de Desenvolvimento**:
   ```bash
   pnpm run dev
   ```

#### Mantendo Atualizado

Para obter as últimas alterações do repositório:

1. **Salve Suas Alterações Locais** (se houver):

   ```bash
   git stash
   ```

2. **Puxar Atualizações Mais Recentes**:

   ```bash
   git pull origin main
   ```

3. **Atualizar Dependências**:

   ```bash
   pnpm install
   ```

4. **Restaurar Suas Alterações Locais** (se houver):
   ```bash
   git stash pop
   ```

#### Solucionando Problemas de Configuração do Git

Se você encontrar problemas:

1. **Instalação Limpa**:

   ```bash
   # Remova os m dulos do node e arquivos de travamento
   rm -rf node_modules pnpm-lock.yaml

   # Limpar cache do pnpm
   pnpm store prune

   # Reinstale as dependências
   pnpm install
   ```

2. **Reverter Alterações Locais**:
  ```bash
   # Descarte todas as alterações locais
   git reset --hard origin/main
   ```
   

---

## Scripts Disponíveis

- **`pnpm run dev`**: Inicia o servidor de desenvolvimento.
- **`pnpm run build`**: Compilação projeto.
- **`pnpm run start`**: Executa a aplicação compilada localmente usando Wrangler Pages.
- **`pnpm run preview`**: Compila e executa a versão de produção localmente.
- **`pnpm test`**: Executa a suíte de testes usando Vitest.
- **`pnpm run typecheck`**: Executa verificação de tipo do TypeScript.
- **`pnpm run typegen`**: Gera tipos do TypeScript usando Wrangler.
- **`pnpm run deploy`**: Publicaça o projeto no Cloudflare Pages.
- **`pnpm run lint:fix`**: Corrige automaticamente problemas de linting.

---

## Contribuição

Nós aceitamos contribuiões! Verifique o nosso [Guia de Contribuição](CONTRIBUTING.md) para começar.

---

## Roadmap

Explore as próximas funcionalidades e prioridades no nosso [Roadmap](https://roadmap.sh/r/ottodev-roadmap-2ovzo).

---

## Perguntas Frequentes

Para obter respostas a perguntas comuns, problemas e ver uma lista de modelos recomendados, visite nossa [Página de Perguntas Frequentes](FAQ.md).
