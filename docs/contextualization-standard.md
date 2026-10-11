# Contextualização baseada em evidências

## Contrato editorial

A ocorrência é descrita com [O] (fonte oficial preferencial, fonte jornalística
quando não existe comunicado oficial). Os marcadores [S], [N] e [I] são opcionais.

- [S]: artigo **existente no catálogo** `wildlife-trafficking-research/papers.json`,
  identificado por título/DOI. Extrair um resultado concreto e explicar por que
  se aplica a espécie, método, mercado, território ou dinâmica do evento.
- [N]: reportagem **existente no catálogo** `wildlife-trafficking-news/news.json`.
  Utilizar para comparação de fatos adicionais, diferenças de versões, rotas
  similares documentadas, mecanismos comerciais ou padrões locais específicos.
  A notícia primária do próprio evento normalmente é [O], não [N].
- [I]: documento **cadastrado** no array `reports` de
  `wildlife-trafficking-reports/reports-institutional.json`, depois de ler seu
  conteúdo e confirmar um resultado verificável aplicável ao caso. Uma URL de
  UNODC/TRAFFIC/CMS fora desse catálogo não é justificativa para [I].

## Fluxo em uma única passagem

1. Extrair identidade da ocorrência (ID, data factual, país, local, taxon,
   indivíduos/itens/peso, modalidade, fonte prioritária oficial, rota documentada).
2. Criar de 2 a 5 *âncoras* para a busca: espécie/família + geografia e
   etapa de cadeia + modus operandi + comércio/produto. Evitar somente 'tráfico de fauna'.
3. Consultar **uma vez** os catálogos atualizados de artigos e reportagens
   e o manifesto de documentos institucionais. Produzir lista curta (até três
   candidatos por categoria), sem aceitar semelhança lexical como prova.
4. Verificar o texto da fonte, resultado utilizado e sua pertinência:
   espécie/método/mercado/território. Rejeitar informação que só afirma existir
   tráfico, ou artigo sem resultado verificável.
5. Formular 1–3 frases analíticas por referência aprovada: resultado concreto,
   pertinência para a ocorrência, hipótese/limite. Separar fato vs inferência.
6. Incluir marcador SOMENTE com fonte e URL; sincronizar context_pt/en/es,
   references_text_pt/en/es e context_references. Não criar placeholders.
7. Validar referencialmente IDs/URLs, citações repetidas, idiomas, quantidade,
   rotas e fontes oficiais. Rodar `python scripts/audit_context_quality.py`.
8. Publicar os arquivos individuais e confirmar o build canônico. Não alterar
   datas, contagens ou rotas durante uma revisão apenas de contexto.

## Controle de qualidade editorial

- Nível A: vínculo direto ou resultado altamente específico aplicável,
  com explicação explícita dos limites.
- Nível B: comparação tecnicamente relevante, mas não ligada ao evento:
  permitida apenas se produzir pergunta concreta de inteligência e não induzir
  vínculo operacional.
- Nível C: contexto geral, repetitivo ou mera ressalva: **não incluir**.
- Ausência justificada de [S], [N] e [I] é MELHOR que citação artificial.
- Um script não determina se uma fonte é verdadeira ou pertinente: editor
  deve verificar cada correspondência e registrar diferenças factuais.
- Jamais presumir proveniência, espécies, rede criminosa ou trajeto não
  documentados; nunca somar embalagens, massa ou filhotes eclodidos a animais.

## Auditoria automática

`python scripts/audit_context_quality.py --root cases --recent 60 --output context-audit.json`

A saída aponta textos-modelo, inconsistências de marcadores e URLs e
documentos institucionais que exigem conferência ao catálogo. É uma triagem
heurística não bloqueante, não uma declaração de qualidade comprovada.
