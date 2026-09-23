const CENTER=[106.7354,10.7505];
const map=new maplibregl.Map({container:'map',center:CENTER,zoom:14.1,pitch:0,bearing:0,style:{version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'osm',type:'raster',source:'osm'}]}});
map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'bottom-left');
const geolocate=new maplibregl.GeolocateControl({positionOptions:{enableHighAccuracy:true},trackUserLocation:true,showUserHeading:true});map.addControl(geolocate,'bottom-left');

const ROOT='https://map.chuyendoisotanthuan.com:2021/';
const layers=[
 {id:'ward',name:'Ranh giới Phường Tân Thuận',src:'public.geo_ranh_gioi_phuong_moi',kind:'line',color:'#c00000',width:4,on:true},
 {id:'blocks',name:'Khu phố',src:'public.geo_khu_pho',kind:'fill',color:'#f1c232',opacity:.10,on:true},
 {id:'planning',name:'Quy hoạch xây dựng',src:'public.view_geo_phan_khu',kind:'fill',color:'#d81b60',opacity:.16,on:true},
 {id:'parcels',name:'Bản đồ địa chính',src:'public.geo_thua_dat',kind:'line',color:'#6d4c41',width:1,on:true,minzoom:15},
 {id:'schools',name:'Trường học',src:'public.geo_truong_hoc',kind:'circle',color:'#1565c0',on:true,minzoom:13},
 {id:'rentals',name:'Nhà trọ',src:'public.geo_nha_tro',kind:'circle',color:'#00897b',on:false,minzoom:13},
 {id:'offices',name:'Cơ quan',src:'public.geo_vi_tri_co_quan',kind:'circle',color:'#c62828',on:true,minzoom:13},
 {id:'permits',name:'Cấp phép xây dựng',src:'public.geo_cap_phep_xay_dung',kind:'circle',color:'#ef6c00',on:false,minzoom:13},
 {id:'oldward',name:'Ranh giới phường cũ',src:'public.geo_ranh_gioi_phuong_cu',kind:'line',color:'#7b1fa2',width:2,on:false}
];
function addLayerDef(x){
 const sid='src-'+x.id,lid='lyr-'+x.id;
 map.addSource(sid,{type:'vector',tiles:[ROOT+x.src+'/{z}/{x}/{y}.pbf']});
 let l={id:lid,source:sid,'source-layer':x.src,type:x.kind,minzoom:x.minzoom||0,layout:{visibility:x.on?'visible':'none'},paint:{}};
 if(x.kind==='line') l.paint={'line-color':x.color,'line-width':x.width||2,'line-opacity':.95};
 if(x.kind==='fill') l.paint={'fill-color':x.color,'fill-opacity':x.opacity||.15,'fill-outline-color':x.color};
 if(x.kind==='circle') l.paint={'circle-radius':6,'circle-color':x.color,'circle-stroke-color':'#fff','circle-stroke-width':2};
 map.addLayer(l);
}
map.on('load',()=>{layers.forEach(addLayerDef);document.getElementById('statusText').textContent='Đã nạp bản đồ hành chính';});

const list=document.getElementById('layerList');layers.forEach(x=>{const lab=document.createElement('label');lab.className='row';lab.innerHTML='<span>'+x.name+'</span><input type="checkbox" '+(x.on?'checked':'')+' data-layer="'+x.id+'">';list.appendChild(lab)});
list.addEventListener('change',e=>{if(!e.target.dataset.layer)return;const id='lyr-'+e.target.dataset.layer;if(map.getLayer(id))map.setLayoutProperty(id,'visibility',e.target.checked?'visible':'none')});
document.getElementById('baseOSM').onchange=e=>map.setLayoutProperty('osm','visibility',e.target.checked?'visible':'none');

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab,.tabpane').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.tab).classList.add('active')});
document.getElementById('collapseBtn').onclick=()=>document.getElementById('panel').classList.add('closed');
document.getElementById('openPanel').onclick=()=>document.getElementById('panel').classList.remove('closed');
document.getElementById('btnHome').onclick=()=>map.flyTo({center:CENTER,zoom:14.1});
document.getElementById('btnLocate').onclick=()=>geolocate.trigger();

map.on('mousemove',e=>document.getElementById('coords').textContent=e.lngLat.lat.toFixed(6)+', '+e.lngLat.lng.toFixed(6));
function search(){const v=document.getElementById('searchInput').value.trim().match(/(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)/);if(!v)return;let a=+v[1],b=+v[2];let lng=a>90?b:b,lat=a>90?a:a;if(Math.abs(a)<=90&&Math.abs(b)>90){lat=a;lng=b}map.flyTo({center:[lng,lat],zoom:17});new maplibregl.Marker({color:'#b5121b'}).setLngLat([lng,lat]).addTo(map)}
document.getElementById('searchBtn').onclick=search;document.getElementById('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')search()});

const interactive=()=>layers.map(x=>'lyr-'+x.id).filter(id=>map.getLayer(id));
map.on('click',e=>{const fs=map.queryRenderedFeatures(e.point,{layers:interactive()});if(!fs.length)return;const f=fs[0],p=f.properties||{};let html='<div class="info-card"><b>'+((layers.find(x=>'lyr-'+x.id===f.layer.id)||{}).name||'Đối tượng')+'</b><div class="info-grid">';Object.entries(p).slice(0,12).forEach(([k,v])=>html+='<div><b>'+escapeHtml(k)+':</b> '+escapeHtml(String(v))+'</div>');html+='</div></div>';document.getElementById('featureInfo').innerHTML=html;document.querySelector('[data-tab="info"]').click();new maplibregl.Popup().setLngLat(e.lngLat).setHTML('<b>Thông tin đối tượng</b><br>'+Object.entries(p).slice(0,4).map(([k,v])=>escapeHtml(k)+': '+escapeHtml(String(v))).join('<br>')).addTo(map)});
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

let mode=null,pts=[];
function ensureMeasure(){if(map.getSource('measure'))return;map.addSource('measure',{type:'geojson',data:{type:'FeatureCollection',features:[]}});map.addLayer({id:'measure-line',type:'line',source:'measure',paint:{'line-color':'#b5121b','line-width':3}});map.addLayer({id:'measure-fill',type:'fill',source:'measure',paint:{'fill-color':'#f6c945','fill-opacity':.25}})}
function start(m){mode=m;pts=[];ensureMeasure();document.getElementById('statusText').textContent=m==='area'?'Đo diện tích: bấm các đỉnh, bấm đúp kết thúc':'Đo khoảng cách: bấm các điểm, bấm đúp kết thúc'}
document.getElementById('measureLength').onclick=()=>start('length');document.getElementById('measureArea').onclick=()=>start('area');
map.on('click',e=>{if(!mode)return;pts.push([e.lngLat.lng,e.lngLat.lat]);drawMeasure()});
map.on('dblclick',e=>{if(!mode)return;e.preventDefault();finishMeasure()});
function drawMeasure(){let features=[];if(pts.length>1)features.push(turf.lineString(pts));if(mode==='area'&&pts.length>2)features.push(turf.polygon([[...pts,pts[0]]]));map.getSource('measure').setData(turf.featureCollection(features))}
function finishMeasure(){drawMeasure();let msg='';if(mode==='length'&&pts.length>1)msg='Khoảng cách: '+turf.length(turf.lineString(pts),{units:'kilometers'}).toFixed(3)+' km';if(mode==='area'&&pts.length>2)msg='Diện tích: '+turf.area(turf.polygon([[...pts,pts[0]]])).toLocaleString('vi-VN',{maximumFractionDigits:1})+' m²';document.getElementById('statusText').textContent=msg||'Đã kết thúc đo';mode=null}
document.getElementById('clearMeasure').onclick=()=>{pts=[];mode=null;if(map.getSource('measure'))map.getSource('measure').setData(turf.featureCollection([]));document.getElementById('statusText').textContent='Đã xóa kết quả đo'}
