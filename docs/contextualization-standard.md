# TG-H — Diretrizes definitivas de contextualização baseada em evidências

## Escopo e princípio editorial

Estas diretrizes regem a etapa de **contextualização OSINT da TG-H**, posterior às etapas de busca, triagem e validação das ocorrências. **Uma busca TG-H não autoriza, por si só, contextualizar ou publicar casos.** A etapa deve ser executada somente quando solicitada.

A contextualização acrescenta evidências, conexões documentadas e interpretações sustentadas por publicações relevantes, **sem reproduzir a descrição factual da apreensão** já exibida no cartão. Usar somente categorias para as quais exista referência efetivamente pertinente ao evento; referências genéricas ou meramente decorativas devem ser omitidas.

## Marcadores de origem — significado obrigatório

- **[O] — Fatos observados do próprio evento.** Informações efetivamente presentes nas notícias ou comunicados que divulgam a ocorrência analisada, sejam fontes oficiais ou reportagens do evento. Registrar fatos, datas, quantidades, locais, modais, atos fiscalizatórios e rotas exatamente como documentados. A notícia primária do caso é [O], mesmo quando publicada por um veículo jornalístico.
- **[S] — Contexto científico.** Resultados científicos verificáveis de artigos efetivamente presentes em `https://github.com/acarvalho-wcs/wildlife-trafficking-research/blob/main/papers.json`. Ler e conferir o trabalho e usar somente achados aplicáveis à espécie, ao produto, ao comércio, à geografia ou ao mecanismo relevante.
- **[I] — Relatórios institucionais da WCS.** Dados, resultados e análises de relatórios **publicados pela WCS** disponíveis no acervo institucional: `https://drive.google.com/drive/u/1/folders/1EX1XaLCaHoHcQuWlAnVWq0Ok5ko_H_FW`. Conferir o conteúdo do documento utilizado; não substituir esta categoria por relatórios genéricos de outras instituições.
- **[N] — Contexto jornalístico.** Resultados e informações de **artigos de contexto** disponíveis no repositório `https://github.com/acarvalho-wcs/wildlife-trafficking-news`. Esses artigos contextualizam a ocorrência por mecanismos, padrões, mercados e geografias comparáveis; não são a notícia primária da própria apreensão, que pertence a [O].
- **[T] — Outros trabalhos publicados.** Publicações relevantes e verificáveis que **não estejam nas listas/acervos das categorias anteriores**. Citar a obra específica e o resultado concreto aproveitado; não usar [T] para duplicar fontes já classificáveis como [S], [I] ou [N].

Os marcadores **[S], [I], [N] e [T] são opcionais por caso**; sua inclusão depende de fonte existente, lida e diretamente pertinente. Uma referência não ganha relevância apenas por mencionar o mesmo país, uma espécie distante ou o termo 'tráfico de fauna'.

## Procedimento de contextualização

1. Identificar o caso confirmado: ID, data **da ocorrência** (distinguida da publicação), local, taxonomia, materiais/quantidades, modal, pontos geográficos e fontes primárias.
2. Registrar somente o que as notícias do próprio evento efetivamente sustentam sob [O]; distinguir apreensão confirmada, origem declarada, itinerário observado e destino pretendido.
3. Construir âncoras de pesquisa específicas: taxon, produto/parte, território, mercado, tipo de transporte, método de ocultação e etapa da cadeia.
4. Consultar os acervos pertinentes de [S], [I] e [N] e trabalhos publicados adicionais para [T]; verificar **o conteúdo integral necessário** e a aplicabilidade de cada referência candidata. A simples presença de um título em índice não basta.
5. Extrair a contribuição concreta da fonte para o entendimento da ocorrência: evidência científica, padrão documentado, informação institucional ou comparação jornalística. Não transformar analogias ou padrões gerais em vínculos operacionais comprovados com o caso.
6. Produzir texto **breve, substantivo, analítico e pronto para publicação**, sem repetir a descrição factual do cartão. Conservar os marcadores correspondentes aos trechos sustentados e citar o título/identificação da fonte e URL verificável.
7. Preparar versões equivalentes em **português, inglês e espanhol**, preservando números, datas, atribuições, níveis de certeza, links e nomenclatura científica (nomes científicos em itálico; qualificadores `sp.`, `spp.` e `cf.` não italicizados).
8. Sincronizar, quando houver publicação no Observatório, `context_pt/en/es`, `references_text_pt/en/es` e `context_references`. Revisar integridade de links, classificação de marcadores, consistência factual e renderização das rotas.
9. Só realizar alterações nos arquivos individuais e no build canônico quando a **inclusão/publicação** tiver sido expressamente solicitada. Revisão de contexto não altera silenciosamente datas, contagens, georreferenciamento ou rotas.

## Regras de qualidade e exclusões editoriais

- Dar preferência a fontes primárias e resultados específicos verificáveis. Sempre distinguir fatos documentados de interpretações e comparações.
- Rotas só podem ser apresentadas quando documentadas; **trajetos realizados, origens declaradas e destinos pretendidos não são equivalentes**. Não inventar pontos intermediários ou conexões.
- Não presumir espécies, redes, pessoas, países de origem, mercados de destino ou relações entre eventos apenas por semelhança.
- Evitar referências artificiais, contextualizações tautológicas e parágrafos de preenchimento.
- **Não inserir no texto publicado frases de ausência de referências**, como: “Não foi localizada nesta rodada referência dos acervos [S], [I] ou [N] suficientemente específica...”.
- **Não inserir ressalvas padronizadas de 'Limites'**, como: “nenhuma ligação entre este evento e os estudos ou reportagens de contexto foi demonstrada...”. Incertezas *materialmente relevantes* podem ser expressas naturalmente na análise, quando necessárias, sem bloco repetitivo.
- Não forçar todos os marcadores em todos os casos. Omitir categoria sem fonte pertinente, em vez de explicar sua ausência.
- Não somar balanços cumulativos de operações como se fossem ocorrências distintas, nem confundir peso, itens, indivíduos e partes derivados de animais.
- Referências devem ser identificáveis, verificáveis e específicas, evitando citações genéricas não vinculadas à proposição.
- A fonte primária de notícia é [O]; o material acadêmico dentro de `papers.json` é [S]; relatório publicado pela WCS no acervo indicado é [I]; artigo do repositório jornalístico é [N]; outras obras publicadas ficam em [T], sem sobreposições.

## Auditoria editorial e técnica

Antes de qualquer publicação, verificar: data da ocorrência versus publicação; quantidades e unidades; deduplicação; fontes e URLs; atribuição correta dos marcadores [O]/[S]/[I]/[N]/[T]; consistência PT/EN/ES; nomenclatura; e evidência para cada rota. A auditoria automatizada existente pode apoiar a triagem, mas **não substitui a validação humana da pertinência e nem reclassifica os marcadores aqui definidos**.

Comando disponível no repositório:

`python scripts/audit_context_quality.py --root cases --recent 60 --output context-audit.json`

A execução desse comando **não** constitui autorização para publicar e não garante que o auditor já reconheça o novo marcador [T] ou a classificação institucional da WCS; resultados do script precisam ser interpretados conforme este contrato editorial.

## Fontes canônicas de consulta

- [S] Artigos científicos: https://github.com/acarvalho-wcs/wildlife-trafficking-research/blob/main/papers.json
- [I] Relatórios publicados pela WCS: https://drive.google.com/drive/u/1/folders/1EX1XaLCaHoHcQuWlAnVWq0Ok5ko_H_FW
- [N] Repositório jornalístico: https://github.com/acarvalho-wcs/wildlife-trafficking-news
- [T] Publicações adicionais verificáveis não incluídas nos acervos acima
- [O] Notícias e comunicados **da ocorrência específica** em análise
