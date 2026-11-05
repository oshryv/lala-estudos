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

## Stack

- HTML + CSS + JavaScript puros (sem frameworks)
- Hospedado no Vercel como site estático
- Fonte: Nunito (Google Fonts)


