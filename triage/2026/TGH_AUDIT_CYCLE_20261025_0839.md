# TG-H 2026 — ciclo de auditoria 25/10/2026

## Escopo e integridade
- Cinco arquivos JSON consultados na branch: part1 a part5, **38 IDs distintos** (Peru 9; Colômbia 18; Equador 3; Bolívia 8).
- Presença de title/card/context nos três idiomas verificada para os 38: **nenhuma chave ausente**. Isso não significa equivalência semântica plenamente revisada nem confirmação de todas as fontes.
- Comparação da data do evento com publicação para os casos com ambas: nenhum caso com data de evento posterior à publicação detectado. Datas ausentes continuam pendentes.
- Não alterados cases.json nem routes.json; sem publicação.

## Correções necessárias identificadas
1. `2026-02-calleria-ucayali-approx500-psittacines`: título PT 'Fiscalia' deve ser 'Ministério Público' ou 'Promotoria'; evitar espanhol misturado.
2. `2026-06-cartagena-airport-two-squirrels-dominican-republic`: PT contém 'duas esquilos' e 'duas esquilos ocultadas'; corrigir para 'dois esquilos' e concordância em título, card e contexto.
3. `2026-06-gualiva-multi-nine-captive-wildlife`: card PT contém 'dois araras'; corrigir para 'duas araras'.
4. `2026-07-monteria-green-shield-22-animals`: **HOLD_SOURCE_ARITHMETIC_CONFLICT**. Fonte oficial afirma 22 e detalhamento soma 23. Não escolher 22 ou 23 como contagem exata até confirmação; não somar ao agregado Green Shield II.
5. Casos multi-localidade requerem modelagem pai/filhos sem duplicação: Bogotá (25/02), Gualivá, Lambayeque, Equador (25–26/05), Escudo Silvestre (Barranquilla/Turbaco). Não atribuir todos os animais a um único ponto.
6. Casos de escopo contestado: universidade de Bogotá (23 répteis; entrega voluntária versus apreensão preventiva) e Machalilla (pesca ilegal, não necessariamente tráfico de fauna). Manter HOLD.
7. Evidência de itinerário pretendido Cartagena → República Dominicana (primatas e esquilos) não significa trânsito concluído. Bahía Solano → aeroporto Alfonso Bonilla é segmento efetivamente reportado; não inferir município de captura.
8. Revisar referências científicas individualmente: referências [S] presentes em alguns registros, mas a integração no corpo dos contextos e a relevância devem ser validadas, sem usar [S] genérico para todos.

## Limites deste ciclo
- Verificação estrutural integral das 38 fichas realizada; conferência independente de cada página primária e cruzamento completo com o cases.json vigente **não concluídos neste ciclo**. Não atribuir estado 'publicável' por simples presença de conteúdo trilíngue.
- Não foram confirmados novos eventos fora dos 38 nesta execução; prospecção transfronteiriça e deduplicação de eventos de países de origem/trânsito/destino continuam pendentes.
- SHA dos cinco arquivos lidos: part1 b24324bfcb865c45a3893497a846429c6bb3e9df; part2 1ee57b2a683509209b431547056e88b1c86f3ce1; part3 a4b2be29dc7c9594cd1552c2dbe62ddb3ba7c860; part4 292fc22ea376217cecddf49e4bbbf38fb94d209c; part5 533d8d232596f0a9c9ef0253fc1a5c8c093e6508.
