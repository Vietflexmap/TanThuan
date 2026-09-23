export const APP_CONFIG = {
  name: 'WebGIS Phường Tân Thuận',
  center: [106.7335338, 10.7500092],
  zoom: 14,
  minZoom: 8,
  maxZoom: 24,
  styles: {
    bright: { type: 'style', url: 'https://tiles.openfreemap.org/styles/bright' },
    osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], attribution: '© OpenStreetMap contributors', maxzoom: 19 },
    imagery: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], attribution: 'Tiles © Esri', maxzoom: 19 }
  },
  vectorBase: 'https://map.chuyendoisotanthuan.com:2021',
  parcelSearchEndpoint: 'https://chuyendoisotanthuan.com/ThuaDat/searchInfoThuaDat_forInput_DVHC_moi',
  groups: [
    { id: 'admin', label: 'Hành chính – địa giới' },
    { id: 'planning', label: 'Địa chính – quy hoạch' },
    { id: 'management', label: 'Quản lý đô thị – xã hội' },
    { id: 'reference', label: 'Dữ liệu tham chiếu' }
  ],
  layers: [
    {
      key: 'khu-pho', group: 'admin', label: 'Bản đồ khu phố', subtitle: 'Ranh và nhãn khu phố', color: '#c61d23', icon: 'KP', enabled: true, visible: true,
      sources: [
        { id: 'geo_khu_pho', tile: '/public.geo_khu_pho/{z}/{x}/{y}.pbf', promoteId: 'gid' },
        { id: 'geo_khu_pho_point', tile: '/public.geo_khu_pho_point/{z}/{x}/{y}.pbf' }
      ],
      mapLayers: [
        { id: 'fill_geo_khu_pho', type: 'fill', source: 'geo_khu_pho', sourceLayer: 'public.geo_khu_pho', minzoom: 12, paint: { 'fill-color': ['case',['boolean',['feature-state','selected'],false],'#ffd33d','#c61d23'], 'fill-opacity': ['case',['boolean',['feature-state','selected'],false],0.22,0.03] } },
        { id: 'line_geo_khu_pho', type: 'line', source: 'geo_khu_pho', sourceLayer: 'public.geo_khu_pho', minzoom: 12, paint: { 'line-color': '#c61d23', 'line-width': 1.6, 'line-opacity': .9 } },
        { id: 'label_geo_khu_pho', type: 'symbol', source: 'geo_khu_pho_point', sourceLayer: 'public.geo_khu_pho_point', minzoom: 13, layout: { 'text-field': ['coalesce',['get','ten'],'Khu phố'], 'text-size': 13, 'text-font': ['Noto Sans Bold'], 'text-allow-overlap': false }, paint: { 'text-color':'#a50f15','text-halo-color':'#fff','text-halo-width':1.5 } }
      ], queryLayerId: 'fill_geo_khu_pho'
    },
    {
      key: 'ranh-phuong', group: 'admin', label: 'Ranh giới phường Tân Thuận', subtitle: 'Ranh giới hành chính hiện hành', color: '#e1000f', icon: 'RG', enabled: true, visible: true,
      sources: [{ id: 'geo_ranh_gioi_phuong_moi', tile: '/public.geo_ranh_gioi_phuong_moi/{z}/{x}/{y}.pbf' }],
      mapLayers: [{ id:'line_geo_ranh_gioi_phuong_moi',type:'line',source:'geo_ranh_gioi_phuong_moi',sourceLayer:'public.geo_ranh_gioi_phuong_moi',minzoom:8,paint:{'line-color':'#e1000f','line-width':4,'line-opacity':1} }]
    },
    {
      key: 'ranh-cu', group: 'admin', label: 'Ranh giới cũ', subtitle: 'Địa giới trước sắp xếp', color: '#7a00ff', icon: 'CŨ', enabled: true, visible: false,
      sources: [
        { id:'geo_ranh_gioi_phuong_cu',tile:'/public.geo_ranh_gioi_phuong_cu/{z}/{x}/{y}.pbf' },
        { id:'geo_ranh_gioi_phuong_cu_point',tile:'/public.geo_ranh_gioi_phuong_cu_point/{z}/{x}/{y}.pbf' }
      ],
      mapLayers: [
        {id:'line_geo_ranh_gioi_phuong_cu',type:'line',source:'geo_ranh_gioi_phuong_cu',sourceLayer:'public.geo_ranh_gioi_phuong_cu',minzoom:10,paint:{'line-color':'#7a00ff','line-width':2.3}},
        {id:'label_geo_ranh_gioi_phuong_cu',type:'symbol',source:'geo_ranh_gioi_phuong_cu_point',sourceLayer:'public.geo_ranh_gioi_phuong_cu_point',minzoom:12,layout:{'text-field':['coalesce',['get','ten_xa'],''], 'text-size':13},paint:{'text-color':'#7a00ff','text-halo-color':'#fff','text-halo-width':1.5}}
      ]
    },
    {
      key: 'ranh-168', group: 'admin', label: 'Ranh giới 168 phường xã', subtitle: 'Tham chiếu TP.HCM', color: '#0022ff', icon: '168', enabled: true, visible: false,
      sources: [
        {id:'geo_ranh_gioi_phuong_xa_moi_tphcm',tile:'/public.geo_ranh_gioi_phuong_xa_moi_tphcm/{z}/{x}/{y}.pbf'},
        {id:'geo_ranh_gioi_phuong_xa_moi_tphcm_point',tile:'/public.geo_ranh_gioi_phuong_xa_moi_tphcm_point/{z}/{x}/{y}.pbf'}
      ],
      mapLayers:[
        {id:'line_geo_ranh_gioi_phuong_xa_moi_tphcm',type:'line',source:'geo_ranh_gioi_phuong_xa_moi_tphcm',sourceLayer:'public.geo_ranh_gioi_phuong_xa_moi_tphcm',minzoom:9,paint:{'line-color':'#0022ff','line-width':1.4,'line-dasharray':[3,2]}},
        {id:'label_geo_ranh_gioi_phuong_xa_moi_tphcm',type:'symbol',source:'geo_ranh_gioi_phuong_xa_moi_tphcm_point',sourceLayer:'public.geo_ranh_gioi_phuong_xa_moi_tphcm_point',minzoom:12,layout:{'text-field':['coalesce',['get','ten_xa'],''],'text-size':12},paint:{'text-color':'#0022ff','text-halo-color':'#fff','text-halo-width':1}}
      ]
    },
    {
      key:'quy-hoach',group:'planning',label:'Quy hoạch xây dựng',subtitle:'Quy hoạch phân khu',color:'#ff9f43',icon:'QH',enabled:true,visible:true,
      sources:[
        {id:'geo_phan_khu',tile:'/public.view_geo_phan_khu/{z}/{x}/{y}.pbf',promoteId:'gid'},
        {id:'view_geo_phan_khu_point',tile:'/public.view_geo_phan_khu_point/{z}/{x}/{y}.pbf'}
      ],
      mapLayers:[
        {id:'fill_view_geo_phan_khu',type:'fill',source:'geo_phan_khu',sourceLayer:'public.view_geo_phan_khu',minzoom:12,paint:{'fill-color':['coalesce',['get','color'],'#ffbf7f'],'fill-opacity':.42}},
        {id:'line_view_geo_phan_khu',type:'line',source:'geo_phan_khu',sourceLayer:'public.view_geo_phan_khu',minzoom:14,paint:{'line-color':'#8f5300','line-width':1}},
        {id:'label_view_geo_phan_khu',type:'symbol',source:'view_geo_phan_khu_point',sourceLayer:'public.view_geo_phan_khu_point',minzoom:15,layout:{'text-field':['coalesce',['get','ten'],''],'text-size':11},paint:{'text-color':'#733b00','text-halo-color':'#fff','text-halo-width':1.2}}
      ],queryLayerId:'fill_view_geo_phan_khu'
    },
    {
      key:'thua-dat',group:'planning',label:'Bản đồ địa chính',subtitle:'Thửa đất và số thửa',color:'#202124',icon:'ĐC',enabled:true,visible:true,
      sources:[
        {id:'geo_thua_dat',tile:'/public.geo_thua_dat/{z}/{x}/{y}.pbf',promoteId:'gid'},
        {id:'geo_thua_dat_point',tile:'/public.geo_thua_dat_point/{z}/{x}/{y}.pbf'}
      ],
      mapLayers:[
        {id:'fill_geo_thua_dat',type:'fill',source:'geo_thua_dat',sourceLayer:'public.geo_thua_dat',minzoom:15,paint:{'fill-color':['case',['boolean',['feature-state','selected'],false],'#ffd33d','#ffffff'],'fill-opacity':['case',['boolean',['feature-state','selected'],false],.42,.035]}},
        {id:'line_geo_thua_dat',type:'line',source:'geo_thua_dat',sourceLayer:'public.geo_thua_dat',minzooom:15,paint:{'line-color':'#282828','line-width':1}},
        {id:'label_geo_thua_dat',type:'symbol',source:'geo_thua_dat_point',sourceLayer:'public.geo_thua_dat_point',minzoom:17,layout:{'text-field':['concat',['to-string',['coalesce',['get','so_thua'],'']], '\n', ['to-string',['coalesce',['get','dien_tich'],'']]],'text-size':10},paint:{'text-color':'#111','text-halo-color':'#fff','text-halo-width':1}}
      ],queryLayerId:'fill_geo_thua_dat'
    },
    { key:'dat-cong',group:'planning',label:'Đất công',subtitle:'Nguồn Đang tết trong bản gốc',color:'#0b8f78',icon:'ĐP',enabled:false,visible:false },
    {
      key:'cap-phep',group:'management',label:'Cấp phép xây dựng',subtitle:'Điểm hồ sơ cấp phép',color:'#d83b01',icon:'XD',enabled:true,visible:true,
      sources:[{id:'geo_cap_phep_xay_dung',tile:'/public.geo_cap_phep_xay_dung/{z}/{x}/{y}.pbf',promoteId:'gid'}],
      mapLayers:[{id:'symbol_geo_cap_phep_xay_dung',type:'circle',source:'geo_cap_phep_xay_dung',sourceLayer:'public.geo_cap_phep_xay_dung',minzoom:14,paint:{'circle-radius':['interpolate',['linear'],['zoom'],14,4,18,7],'circle-color':'#d83b01','circle-stroke-color':'#fff','circle-stroke-width':1.5}}],queryLayerId:'symbol_geo_cap_phep_xay_dung'
    },
    { key:'chung-cu',group:'management',label:'Chung cư',subtitle:'Nguồn đang tắt trong bản gốc',color:'#845ec2',icon:'CC',enabled:false,visible:false },
   { key:'ho-kinh-doanh',group:'management',label:'Hộ kinh doanh',subtitle:'Nguồn đang tắt trong bản gốc',color:'#0081cf',icon:'HKD',enabled:false,visible:false },
    {
      key:'nha-tro',group:'management',label:'Nhà trọ',subtitle:'Cơ sở lưu trú/nhà trọ',color:'#0078d4',icon:'NT',enabled:true,visible:true,
      sources:[{id:'geo_nha_tro',tile:'/public.geo_nha_tro/{z}/{x}/{y}.pbf',promoteId:'gid'}],
      mapLayers:[{id:'symbol_geo_nha_tro',type:'circle',source:'geo_nha_tro',sourceLayer:'public.geo_nha_tro',minzoom:14,paint:{'circle-radius':['interpolate',['linear'],['zoom'],14,4,18,7],'circle-color':'#0078d4','circle-stroke-color':'#fff','circle-stroke-width':1.5}}],queryLayerId:'symbol_geo_nha_tro'
    },
    {
      key:'truong-hoc',group:'management',label:'Trường học',subtitle:'Cơ sở giáo dục',color:'#2e8540',icon:'TH',enabled:true,visible:true,
      sources:[{id:'geo_truong_hoc',tile:'/public.geo_truong_hoc/{z}/{x}/{y}.pbf',promoteId:'gid'}],
      mapLayers:[{id:'symbol_geo_truong_hoc',type:'circle',source:'geo_truong_hoc',sourceLayer:'public.geo_truong_hoc',minzoom:13,paint:{'circle-radius':['interpolate',['linear'],['zoom'],13,4,18,7],'circle-color':'#2e8540','circle-stroke-color':'#fff','circle-stroke-width':1.5}}],queryLayerId:'symbol_geo_truong_hoc'
    },
    {
      key:'co-quan',group:'management',label:'Vị trí cơ quan',subtitle:'Cơ quan công quyền',color:'#a50f15',icon:'CQ',enabled:true,visible:true,
      sources:[{id:'geo_vi_tri_co_quan',tile:'/public.geo_vi_tri_co_quan/{z}/{x}/{y}.pbf',promoteId:'gid'}],
      mapLayers:[{id:'symbol_geo_vi_tri_co_quan',type:'circle',source:'geo_vi_tri_co_quan',sourceLayer:'public.geo_vi_tri_co_quan',minzoom:12,paint:{'circle-radius':['interpolate',['linear'],['zoom'],12,5,18,8],'circle-color':'#a50f15','circle-stroke-color':'#f4c430','circle-stroke-width':2}}],queryLayerId:'symbol_geo_vi_tri_co_quan'
    },
    { key:'xu-ly-vi-pham',group:'management',label:'Xử lý vi phạm',subtitle:'Nguồn đang tắt trong bản gốc',color:'#d13438',icon:'VP',enabled:false,visible:false },
    { key:'du-an',group:'reference',label:'Dự án',subtitle:'Nguồn đang tắt trong bản gốc',color:'#5c2d91',icon:'DA',enabled:false,visible:false }
  ]
};
