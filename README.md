# 📚 Lala Estudos

Plataforma de estudos da Lala — Year 4 do Colégio Pueri Domus.

## O que tem aqui

- **Painel** com todas as matérias (PT + EN)
- **Mapas mentais** visuais de cada matéria
- **Resumos** com dicas de memorização
- **Quiz** geral com questões misturadas
- **Simulados** por matéria em 3 níveis (fácil, médio, difícil) + completo

## Como acessar

Produção: https://lala-estudos-yogw.vercel.app/

Abre em qualquer navegador — computador, celular ou tablet.

## Como editar

O site é um único arquivo HTML estático (`public/index.html`) com CSS e JavaScript embutidos.

Para editar:
1. Edita `public/index.html` direto no GitHub ou localmente
2. Commita as mudanças
3. Vercel redeploya automaticamente em ~30 segundos

## Validar as perguntas

Antes de subir mudanças nas perguntas:

```
node scripts/validate.js
```

Confere 4 alternativas, explicação preenchida, índice da resposta, duplicatas, referências a letras e distribuição das respostas, e testa o embaralhamento. Termina com erro (código 1) se algo estiver quebrado.

As alternativas e a ordem das perguntas são embaralhadas a cada tentativa. Para uma pergunta que depende da posição, use `noShuffle:true`. Num simulado em que a ordem importa, use `fixedOrder:true`. Simulados com texto de leitura já mantêm a ordem.

## Tipos de pergunta

Todas têm `q` e `exp`. Os tipos novos entram nos simulados (não no Quiz).

- `mc` (padrão): `opts` (4) + `a` (0 a 3)
- `fill`: `accept:[...]`
- `vf`: `items:[{t:'afirmação', v:true}, ...]`, cada item é V ou F
- `multi`: `opts` (4) + `answers:[0,2]` (2 ou 3 certas), nota parcial
- `order`: `items:[...]` na ordem certa; o app embaralha
- `match`: `left:[...]` e `right:[...]`, `right[i]` combina com `left[i]`
- `classify`: `cats:['A','B']` + `items:[{t:'texto', c:0}]` (c = índice da categoria)
- `short`: `model:'resposta modelo'`, não pontua; a Lala compara e se corrige

O `scripts/validate.js` confere todos os tipos. A matéria de um trimestre ainda sem conteúdo pode ser criada com `pending:true` e `topicsList`.

## Stack

- HTML + CSS + JavaScript puros (sem frameworks)
- Hospedado no Vercel como site estático
- Fonte: Nunito (Google Fonts)


