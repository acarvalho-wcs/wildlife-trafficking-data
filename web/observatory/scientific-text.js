/* Presentation only: single-asterisk emphasis, never general Markdown or raw HTML. */
window.ScientificText = (() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function tokens(value) {
    const text = String(value ?? ''), result = [];
    // No double stars, intraword multiplication, escaped stars, blank spans or newlines.
    const pattern = /(^|[^\p{L}\p{N}_*\\])\*([^\s*](?:[^*\r\n]*[^\s*])?)\*(?![\p{L}\p{N}_*])/gu;
    const add = (text, italic = false) => { if (text) result.push({text, italic}); };
    let last = 0, match;
    while ((match = pattern.exec(text))) {
      const body = match[2];
      if (!/\p{L}/u.test(body) || body.endsWith('\\') || /https?:\/\//i.test(body)) continue;
      const start = match.index + match[1].length;
      add(text.slice(last, start));
      // Taxonomic qualifiers remain roman even if an editor included them inside a pair.
      const qualifier = /\b(?:spp?|cf)\./g;
      let from = 0, q;
      while ((q = qualifier.exec(body))) {
        add(body.slice(from, q.index), true); add(q[0]); from = qualifier.lastIndex;
      }
      add(body.slice(from), true);
      last = pattern.lastIndex;
    }
    add(text.slice(last));
    return result;
  }
  // Every text token is escaped; the sole generated element is a literal <em>.
  function knownTokens(value,names=[]){
    const unique=[...new Set(names.filter(n=>typeof n==='string'&&/^[A-Z][a-z]+(?: [a-z][a-z-]+){0,2}$/.test(n)))].sort((a,b)=>b.length-a.length);
    if(!unique.length)return tokens(value);
    const pattern=new RegExp('(^|[^\\p{L}\\p{N}_])('+unique.join('|')+')(?![\\p{L}\\p{N}_])','gu');
    return tokens(value).flatMap(part=>{if(part.italic)return [part];const out=[];let last=0;pattern.lastIndex=0;for(const m of part.text.matchAll(pattern)){const i=m.index+m[1].length;if(i>last)out.push({text:part.text.slice(last,i),italic:false});out.push({text:m[2],italic:true});last=i+m[2].length;}if(last<part.text.length)out.push({text:part.text.slice(last),italic:false});return out;});
  }
  const html = (value,names=[]) => knownTokens(value,Array.isArray(names)?names:[]).map(part => part.italic ? '<em>'+escape(part.text)+'</em>' : escape(part.text)).join('');
  // Native title/alt/ARIA attributes cannot contain emphasis elements.
  const plain = value => tokens(value).map(part => part.text).join('');
  return Object.freeze({tokens, knownTokens, html, plain});
})();
