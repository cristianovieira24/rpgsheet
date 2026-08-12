# Arcana — Ficha 5e

Ficha interativa de D&D 5e em português, com criação guiada, regras revisadas de 2024 e opções clássicas de 2014, multiclasses, progressão, magias, talentos OLD/NEW, inventário, história, Códice ilustrado e exportação/importação em JSON.

## Publicar no GitHub Pages

Este projeto já está configurado para o repositório `rpgsheet`.

1. Envie **todo o conteúdo desta pasta** para a raiz do repositório — o arquivo `package.json` deve ficar na página inicial do GitHub, não dentro de uma segunda pasta.
2. Abra **Settings → Pages** no repositório.
3. Em **Build and deployment**, escolha **GitHub Actions**.
4. Abra a aba **Actions** e aguarde o fluxo **Deploy Arcana to GitHub Pages** terminar.
5. Acesse `https://SEU-USUARIO.github.io/rpgsheet/`.

O arquivo `.github/workflows/deploy-pages.yml` instala, testa, compila e publica a pasta correta automaticamente. Não envie `node_modules`.

## Atualizar sem perder fichas

O site salva o rascunho no armazenamento do navegador. Atualizar os arquivos do site normalmente não apaga esse armazenamento, e fichas antigas são migradas quando abertas. Ainda assim, antes de uma grande atualização, use **Ajustes → Exportar ficha**. O JSON exportado inclui história, Códice, quadros, magias próprias, talentos, criações personalizadas e toda a composição de classes.

## Desenvolvimento

Requer Node.js 22 ou superior.

```bash
npm ci
npm test
```

`npm test` executa as verificações de integridade mecânica e gera a versão estática em `gh-pages-dist/`.

## Fontes e conteúdo

- Mecânicas abertas: SRD 5.2.1 e SRD 5.1.
- Opções de outros livros são identificadas pela fonte e usam resumos editoriais; a ferramenta não substitui os livros.
- Arcana é uma ferramenta independente e não é afiliada nem endossada pela Wizards of the Coast.
