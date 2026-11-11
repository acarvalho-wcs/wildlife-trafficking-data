// Pure view-state helper for matching map cameras to the currently selected filters.
// A manual map pan is preserved until a filter, layer, or matching location changes.
export function viewportSignature({search="",filters=[],layers=[],locations=[]}={}){
 const normalizedSearch=String(search).normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
 const selectedLayers=[...layers].map(String).sort();
 const matched=locations.map(r=>[String(r.id??r.record_id??""),r.latitude,r.longitude]);
 return JSON.stringify([normalizedSearch,filters.map(String),selectedLayers,matched]);
}
export function needsViewportFit(force,lastKey,nextKey){
 return Boolean(force)||lastKey!==nextKey;
}
