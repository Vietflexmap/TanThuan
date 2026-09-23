#!/usr/bin/env python3
"""Export the public vector-tile sources declared by the supplied Tan Thuan WebGIS to GeoJSON.

This script is intentionally conservative:
- it does not call account/login or business-record APIs;
- it only requests the vector tile URLs declared in the source HTML;
- it strips properties to a small whitelist for layers that may otherwise expose personal/business details.

Usage:
    python export_tan_thuan_geojson.py --out ../geojson/exported

Requirements:
    pip install -r requirements.txt
"""
from __future__ import annotations

import argparse
import json
import math
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

import requests
import mapbox_vector_tile
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

CENTER = (106.7335338, 10.7500092)
DEFAULT_SCAN_RADIUS_DEG = 0.12
DEFAULT_BOUNDARY_ZOOM = 14

SOURCES = {
    "geo_ranh_gioi_phuong_moi": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_ranh_gioi_phuong_moi/{z}/{x}/{y}.pbf",
        "layer": "public.geo_ranh_gioi_phuong_moi", "zoom": 14,
    },
    "geo_ranh_gioi_phuong_cu": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_ranh_gioi_phuong_cu/{z}/{x}/{y}.pbf",
        "layer": "public.geo_ranh_gioi_phuong_cu", "zoom": 14,
    },
    "geo_ranh_gioi_phuong_cu_point": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_ranh_gioi_phuong_cu_point/{z}/{x}/{y}.pbf",
        "layer": "public.geo_ranh_gioi_phuong_cu_point", "zoom": 14,
    },
    "geo_ranh_gioi_phuong_xa_moi_tphcm": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_ranh_gioi_phuong_xa_moi_tphcm/{z}/{x}/{y}.pbf",
        "layer": "public.geo_ranh_gioi_phuong_xa_moi_tphcm", "zoom": 14,
    },
    "geo_ranh_gioi_phuong_xa_moi_tphcm_point": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_ranh_gioi_phuong_xa_moi_tphcm_point/{z}/{x}/{y}.pbf",
        "layer": "public.geo_ranh_gioi_phuong_xa_moi_tphcm_point", "zoom": 14,
    },
    "geo_khu_pho": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_khu_pho/{z}/{x}/{y}.pbf",
        "layer": "public.geo_khu_pho", "zoom": 14,
    },
    "geo_khu_pho_point": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_khu_pho_point/{z}/{x}/{y}.pbf",
        "layer": "public.geo_khu_pho_point", "zoom": 14,
    },
    "geo_phan_khu": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.view_geo_phan_khu/{z}/{x}/{y}.pbf",
        "layer": "public.view_geo_phan_khu", "zoom": 14,
    },
    "view_geo_phan_khu_point": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.view_geo_phan_khu_point/{z}/{x}/{y}.pbf",
        "layer": "public.view_geo_phan_khu_point", "zoom": 14,
    },
    "geo_truong_hoc": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_truong_hoc/{z}/{x}/{y}.pbf",
        "layer": "public.geo_truong_hoc", "zoom": 14,
    },
    "geo_vi_tri_co_quan": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_vi_tri_co_quan/{z}/{x}/{y}.pbf",
        "layer": "public.geo_vi_tri_co_quan", "zoom": 14,
    },
    "geo_thua_dat": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_thua_dat/{z}/{x}/{y}.pbf",
        "layer": "public.geo_thua_dat", "zoom": 16,
    },
    "geo_thua_dat_point": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_thua_dat_point/{z}/{x}/{y}.pbf",
        "layer": "public.geo_thua_dat_point", "zoom": 16,
    },
    "geo_cap_phep_xay_dung": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_cap_phep_xay_dung/{z}/{x}/{y}.pbf",
        "layer": "public.geo_cap_phep_xay_dung", "zoom": 14,
    },
    "geo_diem_nong": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_diem_nong/{z}/{x}/{y}.pbf",
        "layer": "public.geo_diem_nong", "zoom": 14,
    },
    "geo_nha_tro": {
        "url": "https://map.chuyendoisotanthuan.com:2021/public.geo_nha_tro/{z}/{x}/{y}.pbf",
        "layer": "public.geo_nha_tro", "zoom": 14,
    },
}

DEFAULT_LAYERS = [
    "geo_ranh_gioi_phuong_moi",
    "geo_ranh_gioi_phuong_cu",
    "geo_ranh_gioi_phuong_cu_point",
    "geo_ranh_gioi_phuong_xa_moi_tphcm",
    "geo_ranh_gioi_phuong_xa_moi_tphcm_point",
    "geo_khu_pho",
    "geo_khu_pho_point",
    "geo_phan_khu",
    "view_geo_phan_khu_point",
    "geo_truong_hoc",
    "geo_vi_tri_co_quan",
]

OPTIONAL_GEOMETRY_LAYERS = [
    "geo_thua_dat", "geo_thua_dat_point", "geo_cap_phep_xay_dung",
    "geo_diem_nong", "geo_nha_tro",
]

PROPERTY_WHITELIST = {
    "geo_ranh_gioi_phuong_moi": {"gid","ten","ten_xa","ma_xa","ma"},
    "geo_ranh_gioi_phuong_cu": {"gid","ten","ten_xa","ma_xa","ma"},
    "geo_ranh_gioi_phuong_cu_point": {"gid","ten","ten_xa","ma_xa","ma"},
    "geo_ranh_gioi_phuong_xa_moi_tphcm": {"gid","ten","ten_xa","ma_xa","ma"},
    "geo_ranh_gioi_phuong_xa_moi_tphcm_point": {"gid","ten","ten_xa","ma_xa","ma"},
    "geo_khu_pho": {"gid","ten","dien_tich"},
    "geo_khu_pho_point": {"gid","ten","dien_tich"},
    "geo_phan_khu": {"gid","ten_loai_dat","color","ma_loai_dat"},
    "view_geo_phan_khu_point": {"gid","ten_loai_dat","ma_loai_dat"},
    "geo_truong_hoc": {"gid","ten","ten_truong","cap_hoc","loai_hinh"},
    "geo_vi_tri_co_quan": {"gid","ten","ten_co_quan","loai"},
    "geo_thua_dat": {"gid","dien_tich"},
    "geo_thua_dat_point": {"gid","dien_tich"},
    "geo_cap_phep_xay_dung": {"gid"},
    "geo_diem_nong": {"gid"},
    "geo_nha_tro": {"gid"},
}

def lonlat_to_tile(lon: float, lat: float, z: int) -> tuple[int,int]:
    lat = max(-85.05112878, min(85.05112878, lat))
    n = 2 ** z
    x = int((lon + 180.0) / 360.0 * n)
    lat_rad = math.radians(lat)
    y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return x, y

def tile_range_for_bbox(bbox: tuple[float,float,float,float], z: int):
    west,south,east,north = bbox
    x0,y0 = lonlat_to_tile(west,north,z)
    x1,y1 = lonlat_to_tile(east,south,z)
    for x in range(min(x0,x1), max(x0,x1)+1):
        for y in range(min(y0,y1), max(y0,y1)+1):
            yield x,y

def local_to_lonlat(coord: list[float], x: int, y: int, z: int, extent: int) -> list[float]:
    lx, ly = coord[:2]
    n = 2 ** z
    gx = x + lx / extent
    gy = y + ly / extent
    lon = gx / n * 360.0 - 180.0
    merc_y = math.pi * (1.0 - 2.0 * gy / n)
    lat = math.degrees(math.atan(math.sinh(merc_y)))
    return [lon, lat]

def transform_coords(obj: Any, x: int, y: int, z: int, extent: int):
    if isinstance(obj, (list,tuple)) and len(obj) >= 2 and all(isinstance(v,(int,float)) for v in obj[:2]):
        return local_to_lonlat(list(obj),x,y,z,extent)
    return [transform_coords(v,x,y,z,extent) for v in obj]

def decode_tile(data: bytes, source_layer: str, x: int, y: int, z: int):
    decoded = mapbox_vector_tile.decode(data, default_options={"y_coord_down": True})
    layer = decoded.get(source_layer)
    if layer is None and len(decoded) == 1:
        layer = next(iter(decoded.values()))
    if not layer:
        return []
    extent = int(layer.get("extent", 4096))
    out=[]
    for feat in layer.get("features",[]):
        geom = feat.get("geometry")
        if not geom:
            continue
        geom = dict(geom)
        geom["coordinates"] = transform_coords(geom["coordinates"],x,y,z,extent)
        out.append({
            "type":"Feature",
            "id": feat.get("id"),
            "properties": feat.get("properties") or {},
            "geometry": geom,
        })
    return out

def request_tile(session: requests.Session, url: str, timeout: int = 20, retries: int = 3) -> bytes | None:
    last=None
    for attempt in range(retries):
        try:
            r=session.get(url,timeout=timeout)
            if r.status_code in (204,404):
                return None
            r.raise_for_status()
            return r.content
        except Exception as e:
            last=e
            time.sleep(0.5*(attempt+1))
    print("WARN",url,last)
    return None

def sanitize_properties(layer_name: str, props: dict[str,Any]) -> dict[str,Any]:
    allowed=PROPERTY_WHITELIST.get(layer_name,set())
    return {k:v for k,v in props.items() if k in allowed}

def feature_key(feature: dict[str,Any]):
    props=feature.get("properties") or {}
    for k in ("gid","id","objectid","fid"):
        if k in props and props[k] is not None:
            return (k,str(props[k]))
    if feature.get("id") is not None:
        return ("feature_id",str(feature["id"]))
    return None

def merge_fragments(features: list[dict[str,Any]], layer_name: str):
    groups=defaultdict(list)
    unkeyed=[]
    for f in features:
        key=feature_key(f)
        if key is None:
            unkeyed.append(f)
        else:
            groups[key].append(f)
    result=[]
    for _,items in groups.items():
        geoms=[]
        for item in items:
            try:
                geoms.append(shape(item["geometry"]))
            except Exception:
                pass
        if not geoms:
            continue
        geom=unary_union(geoms)
        result.append({
            "type":"Feature",
            "properties":sanitize_properties(layer_name,items[0].get("properties") or {}),
            "geometry":mapping(geom),
        })
    for item in unkeyed:
        item={"type":"Feature","geometry":item["geometry"],"properties":sanitize_properties(layer_name,item.get("properties") or {})}
        result.append(item)
    return result

def fetch_layer(session, name: str, bbox: tuple[float,float,float,float]):
    cfg=SOURCES[name]
    z=int(cfg["zoom"])
    features=[]
    total=0
    for x,y in tile_range_for_bbox(bbox,z):
        total+=1
        url=cfg["url"].format(z=z,x=x,y=y)
        data=request_tile(session,url)
        if not data:
            continue
        try:
            features.extend(decode_tile(data,cfg["layer"],x,y,z))
        except Exception as e:
            print("WARN decode",name,z,x,y,e)
    print(name,"tiles",total,"raw features",len(features))
    return merge_fragments(features,name)

def geometry_bbox(features: list[dict[str,Any]]):
    geoms=[]
    for f in features:
        try: geoms.append(shape(f["geometry"]))
        except Exception: pass
    if not geoms:
        return None
    return unary_union(geoms).bounds

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--out",default="../geojson/exported")
    ap.add_argument("--scan-radius-deg",type=float,default=DEFAULT_SCAN_RADIUS_DEG)
    ap.add_argument("--include-cadastral",action="store_true",help="Also export parcel/permit/hotspot/lodging tile geometry with stripped attributes")
    ap.add_argument("--layers",nargs="*",help="Explicit source ids; overrides defaults")
    args=ap.parse_args()

    out=Path(args.out)
    out.mkdir(parents=True,exist_ok=True)
    lon,lat=CENTER
    scan=(lon-args.scan_radius_deg,lat-args.scan_radius_deg,lon+args.scan_radius_deg,lat+args.scan_radius_deg)
    session=requests.Session()
    session.headers.update({"User-Agent":"Vietflex-TanThuan-GeoJSON-Exporter/1.0"})

    boundary=fetch_layer(session,"geo_ranh_gioi_phuong_moi",scan)
    if boundary:
        b=geometry_bbox(boundary)
        if b:
            margin=0.01
            bbox=(b[0]-margin,b[1]-margin,b[2]+margin,b[3]+margin)
        else:
            bbox=scan
    else:
        bbox=scan

    selected=args.layers or list(DEFAULT_LAYERS)
    if args.include_cadastral:
        selected += [x for x in OPTIONAL_GEOMETRY_LAYERS if x not in selected]

    summary={"center":CENTER,"bbox_used":bbox,"layers":{}}
    for name in selected:
        if name not in SOURCES:
            print("SKIP unknown",name)
            continue
        features = boundary if name=="geo_ranh_gioi_phuong_moi" else fetch_layer(session,name,bbox)
        fc={"type":"FeatureCollection","name":name,"features":features}
        path=out/(name+".geojson")
        path.write_text(json.dumps(fc,ensure_ascii=False),encoding="utf-8")
        summary["layers"][name]={"feature_count":len(features),"file":path.name}

    (out/"manifest.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    print("Done ->",out.resolve())

if __name__ == "__main__":
    main()
