# OpsValidation

## Regras do Projeto

- Trabalhar com estilização em arquivos `.scss`, mantendo um arquivo para variáveis e outros para estilos.
- Sempre utilizar variáveis de CSS para cores e espaçamentos; não usar hexadecimal direto nos componentes ou folhas de estilo de UI.
- Separar tudo em uma estrutura de projeto clara: `data`, `public`, `src`, `src/lib`, `src/styles`, `scripts`, etc.
- Manter o CSS minificado nos builds e priorizar SCSS com nesting. Evitar duplicação de classes.
- Evitar números mágicos. Priorizar tokens existentes sempre que fizer sentido.
- Usar conventional commits/semantic commits.
- Sempre compilar o CSS ao alterar o SCSS.
- Se a pessoa usuária modificar o código manualmente, nunca reverter essas alterações a não ser que ela peça explicitamente.

## Arquitetura

- As regras de validação vivem em JSONs separados por frente em `data/`.
- Os JSONs publicados para o app ficam em `public/data/` e são sincronizados com `npm run sync:data`.
- A camada TypeScript deve tratar as frentes como configurações carregadas em runtime, sem hardcode de regras no código.
- O portal é único, mas cadastro, histórico, dashboard, taxonomia e régua devem respeitar filtros por frente.
