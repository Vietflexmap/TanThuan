/*
 * Vietflex WebGIS application core.
 * Adapted from https://github.com/Vietflexmap/webgis
 * Keeps the same concepts: createMap, LayerRegistry, source/layer factories,
 * visibility management, feature interaction and measure tool.
 */

export function createMap(options) {
  const { navigationControl = true, scaleControl = true, geolocateControl = false, ...mapOptions } = options;
  const map = new maplibregl.Map(mapOptions);
  if (navigationControl) map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  if (scaleControl) map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 100 }), 'bottom-left');
  if (geolocateControl) map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), 'top-right');
  return map;
}

export class LayerRegistry {
  constructor(initial = []) { this.definitions = new Map(); initial.forEach((d) => this.register(d)); }
  register(definition) {
    if (!definition.key || !definition.key.trim()) throw new Error('Layer key is required');
    this.definitions.set(definition.key, { enabled: true, visible: true, ...definition });
    return this;
  }
  get(key) { return this.definitions.get(key); }
  entries() { return [...this.definitions.values()]; }
  enabled() { return this.entries().filter((d) => d.enabled !== false); }
  queryable() { return this.enabled().filter((d) => d.queryLayerId); }
  getByQueryLayerId(id) { return this.entries().find((d) => d.queryLayerId === id); }
}

export function addVectorSource(map, id, tileUrl, promoteId) {
  if (map.getSource(id)) return;
  const source = { type: 'vector', tiles: [tileUrl], minzoom: 0, maxzoom: 24 };
  if (promoteId) source.promoteId = promoteId;
  map.addSource(id, source);
}

export function addConfiguredLayer(map, spec) {
  if (map.getLayer(spec.id)) return;
  const layer = { id: spec.id, type: spec.type, source: spec.source };
  if (spec.sourceLayer) layer['source-layer'] = spec.sourceLayer;
  if (typeof spec.minzoom === 'number') layer.minzoom = spec.minzoom;
  if (typeof spec.maxzoom === 'number') layer.maxzoom = spec.maxzoom;
  if (spec.layout) layer.layout = spec.layout;
  if (spec.paint) layer.paint = spec.paint;
  if (spec.filter) layer.filter = spec.filter;
  map.addLayer(layer);
}

export function setLayerVisibility(map, ids, visible) {
  const value = visible ? 'visible' : 'none';
  ids.forEach((id) => { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', value); });
}

export class FeatureInteraction {
  constructor(map, registry) { this.map = map; this.registry = registry; this.selected = null; }
  pick(event) {
    const candidates = this.registry.queryable().filter((d) => d.visible !== false && this.map.getLayer(d.queryLayerId));
    if (!candidates.length) return null;
    const layers = candidates.map((d) => d.queryLayerId);
    const feature = this.map.queryRenderedFeatures(event.point, { layers })[0];
    if (!feature) return null;
    const definition = this.registry.getByQueryLayerId(feature.layer.id);
    return definition ? { definition, feature } : null;
  }
  clearSelection() {
    if (!this.selected) return;
    try {
      this.map.setFeatureState(this.selected, { selected: false });
    } catch (_) {}
    this.selected = null;
  }
  select(picked) {
    this.clearSelection();
    const f = picked.feature;
    if (f.id == null || !f.source || !f.sourceLayer) return;
    const target = { source: f.source, sourceLayer: f.sourceLayer, id: f.id };
    try { this.map.setFeatureState(target, { selected: true }); this.selected = target; } catch (_) {}
  }
  bindClick(handler) {
    const fn = (event) => {
      const picked = this.pick(event);
      if (!picked) return;
      this.select(picked);
      handler(picked, event);
    };
    this.map.on('click', fn);
    return () => this.map.off('click', fn);
  }
}

export class MeasureTool {
  constructor(map, onUpdate) {
    this.map = map; this.onUpdate = onUpdate; this.mode = null; this.coords = []; this.markers = [];
    this.clickHandler = (e) => this.onClick(e); this.dblHandler = (e) => this.finish(e); this.moveHandler = (e) => this.onMove(e);
  }
  ensureLayers() {
    if (this.map.getSource('vf-measure')) return;
    this.map.addSource('vf-measure', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    this.map.addLayer({ id:'vf-measure-fill',type:'fill',source:'vf-measure',filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#f4c430','fill-opacity':.22} });
    this.map.addLayer({ id:'vf-measure-line',type:'line',source:'vf-measure',paint:{'line-color':'#a50f15','line-width':3,'line-dasharray':[1.5,1]} });
  }
  start(mode) {
    this.clear(false); this.ensureLayers(); this.mode = mode; this.map.getCanvas().style.cursor = 'crosshair';
    this.map.doubleClickZoom.disable(); this.map.on('click', this.clickHandler); this.map.on('dblclick', this.dblHandler); this.map.on('mousemove', this.moveHandler);
    this.emit('Nhấp trên bản đồ để bắt đầu');
  }
  onClick(e) {
    if (!this.mode) return; this.coords.push([e.lngLat.lng, e.lngLat.lat]);
    const el=document.createElement('div'); el.style.cssText='width:10px;height:10px;border-radius:50%;background:#a50f15;border:2px solid #fff;box-shadow:0 0 0 1px #6f0b10';
    this.markers.push(new maplibregl.Marker({element:el}).setLngLat(e.lngLat).addTo(this.map)); this.render();
  }
  onMove(e) {
    if (!this.mode || !this.coords.length) return;
    const temp=[...this.coords,[e.lngLat.lng,e.lngLat.lat]]; this.render(temp, true);
  }
  render(coords = this.coords, preview = false) {
    if (!this.map.getSource('vf-measure')) return;
    let geometry = null, value = 'Tiếp tục nhấp để đo';
    if (this.mode === 'distance' && coords.length >= 2) {
      geometry = turf.lineString(coords); const km=turf.length(geometry,{units:'kilometers'}); value=km<1 ? (km*1000).toFixed(1)+' m' : km.toFixed(3)+' km';
    } else if (this.mode === 'area' && coords.length >= 3) {
      const ring=[...coords,coords[0]]; geometry=turf.polygon([ring]); const sqm=turf.area(geometry); value=sqm<10000 ? sqm.toFixed(1)+' m²' : (sqm/10000).toFixed(3)+' ha';
    } else if (coords.length) { geometry=turf.lineString(coords); }
    this.map.getSource('vf-measure').setData({type:'FeatureCollection',features:geometry?[geometry]:[]});
    if (!preview || coords.length > this.coords.length) this.emit(value); else this.emit(value);
  }
  finish(e) { if (!this.mode) return; e.preventDefault(); this.render(); this.stopListeners(); }
  stopListeners() { this.map.off('click',this.clickHandler);this.map.off('dblclick',this.dblHandler);this.map.off('mousemove',this.moveHandler);this.map.doubleClickZoom.enable();this.map.getCanvas().style.cursor=''; }
  clear(emit = true) { this.stopListeners();this.mode=null;this.coords=[];this.markers.forEach((m)=>m.remove());this.markers=[];if(this.map.getSource('vf-measure'))this.map.getSource('vf-measure').setData({type:'FeatureCollection',features:[]});if(emit)this.emit('Đã xóa kết quả đo'); }
  emit(value){ if(this.onUpdate)this.onUpdate({mode:this.mode,value}); }
}
