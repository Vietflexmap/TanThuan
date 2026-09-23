import { APP_CONFIG } from './config.js';
import { createMap, LayerRegistry, addVectorSource, addConfiguredLayer, setLayerVisibility, FeatureInteraction, MeasureTool } from './webgis-core.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const registry = new LayerRegistry(APP_CONFIG.layers);
let currentBasemap = 'bright';
let interaction;
let unbindInteraction;
let measure;
let lastPopup;

const map = createMap({
  container: 'map', style: APP_CONFIG.styles.bright.url, center: APP_CONFIG.center, zoom: APP_CONFIG.zoom,
  minZoom: APP_CONFIG.minZoom, maxZoom: APP_CONFIG.maxZoom, navigationControl: true, scaleControl: true
});

function toast(title, message, type = '') {
  const el = document.createElement('div'); el.className = 'toast ' + type;
  el.innerHTML = '<strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(message) + '</span>';
  $('#toastStack').appendChild(el); setTimeout(() => el.remove(), 4200);
}
function escapeHtml(v){ return String(v ?? '').replace(/[&<>'"]/g,(c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
function humanKey(k){ return String(k).replace(/_/g,' ').replace(/\b\w/g,(m)=>m.toUpperCase()); }
function layerIds(def){ return (def.mapLayers || []).map((l)=>l.id); }
function sourceUrl(path){ return APP_CONFIG.vectorBase + path; }
function makeBaseRasterStyle(def){ return {version:8,sources:{base:{type:'raster',tiles:def.tiles,tileSize:256,attribution:def.attribution,maxzoom:def.maxzoom||19}},layers:[{id:'base',type:'raster',source:'base'}]}; }

function renderLayerList(){
  const root=$('#layerList'); root.innerHTML='';
  APP_CONFIG.groups.forEach((group)=>{
    const items=registry.entries().filter((d)=>d.group===group.id); if(!items.length)return;
    const wrap=document.createElement('div');wrap.className='layer-group';
    wrap.innerHTML='<div class="layer-group-title">'+escapeHtml(group.label)+'</div>';
    items.forEach((def)=>{
      const row=document.createElement('div');row.className='layer-item'+(def.enabled===false?' disabled':'');
      row.innerHTML='<div class="layer-swatch" style="background:'+escapeHtml(def.color||'#777')+'">'+escapeHtml(def.icon||'•')+'</div>'+
      '<div class="layer-copy"><b>'+escapeHtml(def.label)+(def.enabled===false?'<span class="layer-status">chờ nguồn</span>':'')+'</b><small>'+escapeHtml(def.subtitle||'')+'</small></div>'+
      '<label class="layer-toggle"><input type="checkbox" data-layer-key="'+escapeHtml(def.key)+'" '+(def.visible!==false&&def.enabled!==false?'checked':'')+' '+(def.enabled===false?'disabled':'')+'><span></span></label>';
      wrap.appendChild(row);
    }); root.appendChild(wrap);
  });
  $$('[data-layer-key]').forEach((input)=>input.addEventListener('change',()=>toggleLayer(input.dataset.layerKey,input.checked)));
}

function installOperationalLayers(){
  registry.enabled().forEach((def)=>{
    (def.sources||[]).forEach((s)=>addVectorSource(map,s.id,sourceUrl(s.tile),s.promoteId));
    (def.mapLayers||[]).forEach((layer)=>{ if(layer.type==='symbol' && !map.getStyle().glyphs) return; addConfiguredLayer(map,layer); if(def.visible===false)setLayerVisibility(map,[layer.id],false); });
  });
}

function toggleLayer(key, visible){
  const def=registry.get(key); if(!def||def.enabled===false)return; def.visible=visible; setLayerVisibility(map,layerIds(def),visible);
  const input=$('[data-layer-key=\"'+def.key+'\"]'); if(input) input.checked=visible; toast(def.label, visible?'Đã bật lớp dữ liệu.':'Đã tắt lớp dữ liệu.', visible?'success':'');
}

function setAllLayers(visible){
  registry.enabled().forEach((def)=>{ def.visible=visible; setLayerVisibility(map,layerIds(def),visible); const input=$('[data-layer-key="'+def.key+'"]'); if(input)input.checked=visible; });
}

function activateTab(tab){
  $$('.drawer-tab').forEach((b)=>b.classList.toggle('active',b.dataset.tab===tab));
  $$('.tab-panel').forEach((p)=>p.classList.toggle('active',p.dataset.panel===tab));
}

function renderFeatureInfo(picked,event){
  const def=picked.definition, f=picked.feature, props=f.properties||{}, coord=event.lngLat;
  const keys=Object.keys(props).filter((k)=>props[k]!==null&&props[k]!==''&&typeof props[k]!=='object').slice(0,24);
  const rows=keys.length?keys.map((k)=>'<div class="property-row"><span>'+escapeHtml(humanKey(k))+'</span><b>'+escapeHtml(props[k])+'</b></div>').join(''):'<div class="property-row"><span>Dữ liệu</span><b>Không có thuộc tính công khai trong tile</b></div>';
  $('#featureInfo').className='feature-info';
  $('#featureInfo').innerHTML='<div class="info-hero"><span>'+escapeHtml(def.label).toUpperCase()+'</span><strong>'+escapeHtml(props.ten||props.name||props.ky_hieu||props.so_thua||def.label)+'</strong><div class="info-coords">'+coord.lat.toFixed(6)+', '+coord.lng.toFixed(6)+'</div></div><div class="property-table">'+rows+'</div><div class="info-actions"><a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+coord.lat+','+coord.lng+'">Đường đi</a><a target="_blank" rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint='+coord.lat+','+coord.lng+'">Xem phố</a></div>';
  activateTab('info');
  if(lastPopup)lastPopup.remove();
  lastPopup=new maplibregl.Popup({offset:10,maxWidth:'280px'}).setLngLat(coord).setHTML('<div class="map-popup"><h4>'+escapeHtml(def.label)+'</h4><div><b>Tọa độ:</b> '+coord.lat.toFixed(6)+', '+coord.lng.toFixed(6)+'<br>Nhấn tab <b>Thông tin</b> để xem chi tiết.</div></div>').addTo(map);
}

function extractLatLng(input){
  const s=input.trim(); let m=s.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/); if(m)return {lat:+m[1],lng:+m[2]};
  m=s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/); if(m)return {lat:+m[1],lng:+m[2]};
  m=s.match(/!3d(-?\d+(?:\.\d+)?)[^!]*!4d(-?\d+(?:\.\d+)?)/); if(m)return {lat:+m[1],lng:+m[2]};
  m=s.match(/(?:q|query|destination)=(-?\d+(?:\.\d+)?)[,%2C+ ]+(-?\d+(?:\.\d+)?)/i); if(m)return {lat:+m[1],lng:+m[2]}; return null;
}
function goToCoordinate(input){
  const p=extractLatLng(input); if(!p||Math.abs(p.lat)>90||Math.abs(p.lng)>180){toast('Không nhận diện được tọa độ','Nhập dạng 10.7506, 106.7334 hoặc URL Google Maps có tọa độ.','warn');return false;}
  map.flyTo({center:[p.lng,p.lat],zoom:18,duration:1200}); new maplibregl.Marker({color:'#a50f15'}).setLngLat([p.lng,p.lat]).addTo(map); toast('Đã định vị',p.lat.toFixed(6)+', '+p.lng.toFixed(6),'success');return true;
}

async function searchParcel(){
  const sheet=$('#parcelSheet').value.trim(), parcel=$('#parcelNo').value.trim(), out=$('#parcelSearchResult');
  if(!sheet&&!parcel){out.className='search-result';out.textContent='Vui lòng nhập số tờ hoặc số thửa.';return;}
  if((sheet&&!/^\d+$/.test(sheet))||(parcel&&!/^\d+$/.test(parcel))){out.className='search-result';out.textContent='Số tờ/số thửa phải là số nguyên không âm.';return;}
  out.className='search-result';out.textContent='Đang kết nối API tra cứu gốc…';
  try{
    const body=new URLSearchParams({so_to:sheet,so_thua:parcel}); const res=await fetch(APP_CONFIG.parcelSearchEndpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
    if(!res.ok)throw new Error('HTTP '+res.status); const html=await res.text(); const doc=new DOMParser().parseFromString(html,'text/html');
    doc.querySelectorAll('script,style,iframe,object').forEach((n)=>n.remove()); doc.querySelectorAll('*').forEach((n)=>[...n.attributes].forEach((a)=>{if(/^on/i.test(a.name)||a.name==='style')n.removeAttribute(a.name);}));
    const text=doc.body.textContent.replace(/\s+/g,' ').trim(); out.textContent=text||'API đã phản hồi nhưng không có nội dung hiển thị.';
  }catch(err){out.innerHTML='<b>Không thể gọi API gốc trực tiếp từ GitHub Pages.</b><br>Cần bật CORS hoặc đặt proxy riêng cho endpoint tra cứu. Bản đồ và các lớp vector vẫn hoạt động độc lập.';toast('Tra cứu thửa đất','Endpoint gốc không cho phép truy cập từ miền hiện tại.','warn');}
}

function switchBasemap(key){
  const def=APP_CONFIG.styles[key]; if(!def)return; currentBasemap=key;
  const center=map.getCenter(),zoom=map.getZoom(),bearing=map.getBearing(),pitch=map.getPitch();
  map.setStyle(def.type==='style'?def.url:makeBaseRasterStyle(def));
  map.once('style.load',()=>{ installOperationalLayers(); setupInteraction(); map.jumpTo({center,zoom,bearing,pitch}); });
  $$('.basemap-option').forEach((b)=>b.classList.toggle('active',b.dataset.basemap===key)); $('#basemapMenu').classList.add('hidden'); toast('Đổi nền bản đồ','Đã chuyển sang '+key+'.','success');
}

function setupInteraction(){
  if(unbindInteraction) unbindInteraction();
  interaction=new FeatureInteraction(map,registry); unbindInteraction=interaction.bindClick((picked,event)=>renderFeatureInfo(picked,event));
  const interactive=registry.queryable().map((d)=>d.queryLayerId).filter((id)=>map.getLayer(id));
  interactive.forEach((id)=>{map.on('mouseenter',id,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',id,()=>map.getCanvas().style.cursor='');});
}

function startMeasure(mode){
  measure.start(mode); $('#measureHud').classList.remove('hidden'); $('#measureModeLabel').textContent=mode==='distance'?'ĐO KHOẢNG CÁCH':'ĐO DIỆN TÍCH';
}
function initMeasure(){ measure=new MeasureTool(map,({value})=>{ $('#measureValue').textContent=value; }); }

map.on('load',()=>{
  installOperationalLayers(); renderLayerList(); setupInteraction(); initMeasure();
  map.on('mousemove',(e)=>$('#statusLngLat').textContent=e.lngLat.lng.toFixed(5)+' · '+e.lngLat.lat.toFixed(5));
  map.on('zoom',()=>$('#statusZoom').textContent='Z'+map.getZoom().toFixed(1));
  toast('WebGIS Tân Thuận','Đã tải lõi Vietflex WebGIS và các lớp dữ liệu công khai.','success');
});
map.on('error',(e)=>{ const msg=e?.error?.message||''; if(/tile|source|pbf|fetch/i.test(msg)) console.warn('[WebGIS source]',msg); });

$('#toggleAllLayers').addEventListener('change',(e)=>setAllLayers(e.target.checked));
$$('.drawer-tab').forEach((b)=>b.addEventListener('click',()=>activateTab(b.dataset.tab)));
$('#drawerToggle').addEventListener('click',()=>{const d=$('#controlDrawer');const closed=d.classList.toggle('collapsed');$('#drawerToggle').classList.toggle('drawer-closed',closed);$('#drawerToggle').textContent=closed?'‹':'›';});
$('#btnHome').addEventListener('click',()=>map.flyTo({center:APP_CONFIG.center,zoom:APP_CONFIG.zoom,duration:1000}));
$('#btnLocate').addEventListener('click',()=>{if(!navigator.geolocation){toast('Vị trí','Trình duyệt không hỗ trợ định vị.','warn');return;}navigator.geolocation.getCurrentPosition((p)=>{map.flyTo({center:[p.coords.longitude,p.coords.latitude],zoom:17});new maplibregl.Marker({color:'#a50f15'}).setLngLat([p.coords.longitude,p.coords.latitude]).addTo(map);},()=>toast('Vị trí','Không thể lấy vị trí. Hãy cấp quyền GPS cho trình duyệt.','warn'),{enableHighAccuracy:true});});
$('#btnMeasureDistance').addEventListener('click',()=>startMeasure('distance')); $('#btnMeasureArea').addEventListener('click',()=>startMeasure('area'));
$('#btnClearMeasure').addEventListener('click',()=>{if(measure)measure.clear();$('#measureHud').classList.add('hidden');});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&measure){measure.clear();$('#measureHud').classList.add('hidden');}});
$('#btnBasemap').addEventListener('click',()=>$('#basemapMenu').classList.toggle('hidden')); $$('.basemap-option').forEach((b)=>b.addEventListener('click',()=>switchBasemap(b.dataset.basemap)));
$('#globalSearchForm').addEventListener('submit',(e)=>{e.preventDefault();goToCoordinate($('#globalSearchInput').value);}); $('#btnCoordinateSearch').addEventListener('click',()=>goToCoordinate($('#coordinateSearch').value));
$('#btnParcelSearch').addEventListener('click',searchParcel);
$$('[data-quick]').forEach((b)=>b.addEventListener('click',()=>{const q=b.dataset.quick;if(q==='center')map.flyTo({center:APP_CONFIG.center,zoom:15});if(q==='planning'){toggleLayer('quy-hoach',true);map.flyTo({center:APP_CONFIG.center,zoom:15});}if(q==='parcels'){toggleLayer('thua-dat',true);map.flyTo({center:APP_CONFIG.center,zoom:17});}if(q==='offices'){toggleLayer('co-quan',true);map.flyTo({center:APP_CONFIG.center,zoom:15});}}));
$('#btnFullscreen').addEventListener('click',()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.();});
window.addEventListener('resize',()=>map.resize());
