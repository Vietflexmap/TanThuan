# Vietflex WebGIS · Phường Tân Thuận

WebGIS hành chính chuyên biệt cho **Phường Tân Thuận, TP.HCM**, thiết kế lại theo kiến trúc tái sử dụng của [Vietflexmap/webgis](https://github.com/Vietflexmap/webgis) và nhóm nghiệp vụ của phiên bản Tân Thuận gốc.

## Mục tiêu

- Giao diện hành chính **đỏ – vàng**, responsive desktop/mobile.
- MapLibre GL JS + lớp vector tile cấu hình độc lập.
- Tách `config.js`, `webgis-core.js`, `app.js` để không quay lại kiến trúc HTML monolith.
- Nhóm lớp: địa giới/khu phố, quy hoạch, địa chính, cấp phép xây dựng, nhà trọ, trường học, cơ quan.
- Chọn đối tượng và xem thuộc tính vector tile.
- Tra cứu tọa độ / URL Google Maps.
- Đo khoảng cách, diện tích bằng Turf.
- Chuyển nền Bright / OSM / ảnh vệ tinh.
- Có sẵn GitHub Actions để triển khai GitHub Pages.

## Cấu trúc

```text
TanThuan/
├── index.html
├── assets/
│   ├── css/app.css
│   └── js/
│       ├── config.js
│       ├── webgis-core.js
│       └── app.js
├── .github/workflows/pages.yml
└── .nojekyll
```

## Cấu hình dữ liệu

Toàn bộ endpoint và layer nằm trong `assets/js/config.js`. Các vector tile đang dùng cấu trúc endpoint được nhận diện từ bản WebGIS Tân Thuận gốc:

```text
https://map.chuyendoisotanthuan.com:2021/<source-layer>/{z}/{x}/{y}.pbf
```

Một số nguồn trong snapshot gốc đã bị comment/tắt (`Đất công`, `Chung cư`, `Hộ kinh doanh`, `Xử lý vi phạm`, `Dự án`). Bản mới vẫn hiển thị chúng trong danh mục với trạng thái **chờ nguồn**, nhưng không gọi endpoint không còn được bật.

Tra cứu số tờ/số thửa gọi API gốc khi CORS cho phép. Nếu triển khai GitHub Pages mà API chặn CORS, sẽ cầl proxy/backend do bạn quản lý.

## GitHub Pages

Workflow `pages.yml` deploy site tỉnh từ root. Trong **Settings → Pages**, chọn **Source: GitHub Actions** nếu repository chưa được bật Pages.

## Nguồn lõi

`assets/js/webgis-core.js` là lớp ứng dụng JavaScript được tách theo các khái niệm của `Vietflexmap/webgis`: `createMap`, `LayerRegistry`, source/layer factory, visibility, `FeatureInteraction` và `MeasureTool`.

## License

Mã nguồn mới trong repository có thể dùng theo giấy phép MIT của hệ sinh thái Vietflex nếu chủ repository giữ lựa chọn đó. Dữ liệu, tile, ảnh nền và API bên thứ ba tuân theo điều khoản của từng nhà cung cấp.
