# TanThuan GeoData — source-derived extraction package

Gói này chỉ dùng thông tin được xác định từ mã nguồn WebGIS Phường Tân Thuận đã cung cấp.

## Có sẵn ngay trong gói

- `metadata/system_info.json`: tên hệ thống, mô tả, tâm bản đồ, mức zoom, style.
- `catalog/vector_sources.json`: 23 nguồn vector tile PBF tìm thấy trong mã, có đánh dấu active/commented.
- `catalog/boundary_sources.json`: nhóm địa giới/phường/khu phố.
- `catalog/geojson_api_endpoints.json`: các endpoint có tên GeoJSON được mã nguồn gọi.
- `catalog/ui_layers.json`: các lớp dữ liệu hiển thị trên giao diện.
- `catalog/property_whitelist.json`: thuộc tính an toàn mà exporter được phép giữ.
- `geojson/tan_thuan_source_center.geojson`: điểm tâm bản đồ được khai báo trực tiếp trong source.
- `source_excerpt/relevant_source_lines.txt`: trích đoạn source liên quan để đối chiếu.

## Vì sao chưa có sẵn ranh giới GeoJSON hoàn chỉnh?

Mã HTML không chứa mảng tọa độ ranh giới đầy đủ. Nó khai báo các nguồn PBF kiểu:

- `public.geo_ranh_gioi_phuong_moi/{z}/{x}/{y}.pbf`
- `public.geo_ranh_gioi_phuong_cu/{z}/{x}/{y}.pbf`
- `public.geo_khu_pho/{z}/{x}/{y}.pbf`
- `public.view_geo_phan_khu/{z}/{x}/{y}.pbf`

và một số API trả GeoJSON theo đối tượng/thửa. Vì vậy việc tạo GeoJSON đầy đủ phải tải các vector tile rồi ghép geometry.

## Xuất PBF -> GeoJSON

```bash
cd scripts
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python export_tan_thuan_geojson.py --out ../geojson/exported
```

Mặc định exporter lấy các lớp hành chính/quy hoạch/công cộng: ranh giới mới/cũ, ranh 168 phường xã, khu phố, phân khu, trường học, cơ quan.

Nếu cần thêm hình học địa chính/cấp phép/điểm nóng/nhà trọ nhưng vẫn loại bỏ phần lớn thuộc tính:

```bash
python export_tan_thuan_geojson.py --out ../geojson/exported --include-cadastral
```

## Bảo vệ dữ liệu

Gói này không tự gọi các API hồ sơ người dùng/đăng nhập và không thu thập tên chủ đất, số điện thoại, tài khoản hay hồ sơ cá nhân. Các lớp có khả năng chứa thông tin nhạy cảm được exporter giới hạn thuộc tính.

## Nguồn

Source HTML: `Đã dán markdown (2)(2).md`, SHA-256 ghi trong `metadata/system_info.json`.
