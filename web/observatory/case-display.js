/* Presentation contract for new PT/EN/ES records. Legacy case display is unchanged. */
window.CaseDisplay=(()=>{
 'use strict';
 const fields=['location_label','fauna_label','taxon_text','modal_label','quantity_label','quantity_note','geographic_note'];
 const languages=['pt','en','es'];
 function validate(r){
  if(r?.localization_schema_version!==1)return true;
  for(const lang of languages)for(const stem of fields){const v=r[stem+'_'+lang];if(typeof v!=='string'||!v.trim())return false;}
  return true;
 }
 function localize(r,lang='en'){
  if(r?.localization_schema_version!==1)return null;
  if(!languages.includes(lang)||!validate(r))throw Error('Incomplete case card translations: '+r?.id);
  const text=stem=>r[stem+'_'+lang];
  return {city:text('location_label'),species:text('fauna_label'),taxon:text('taxon_text'),mode:text('modal_label'),quantityDisplay:text('quantity_label'),quantityNote:text('quantity_note'),geoNote:text('geographic_note')};
 }
 return Object.freeze({fields,languages,validate,localize});
})();
