#!/bin/bash
# restore_database.sh - Restore database.sql directly to Supabase PostgreSQL
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${1:-$DIR/database.sql}"
ENV_FILE="$DIR/.env.local"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: Không tìm thấy file SQL tại $SQL_FILE"
  exit 1
fi

DB_URL="postgresql://postgres.qpdsjaxilorovzboexrq:%40Vinhdat123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

echo "=========================================================="
echo "🚀 Đang restore dữ liệu từ $SQL_FILE lên Supabase..."
echo "=========================================================="

psql "$DB_URL" -f "$SQL_FILE" > /dev/null

echo "✅ Đã nạp thành công toàn bộ bảng & dữ liệu vào Supabase!"
echo ""
echo "📊 Kiểm tra số lượng bản ghi hiện tại trên Supabase:"
echo "----------------------------------------------------------"
psql "$DB_URL" -c "
SELECT 
    table_name AS \"Bảng dữ liệu\", 
    (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I', table_name), false, true, '')))[1]::text::int AS \"Số bản ghi\"
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
"
echo "=========================================================="
echo "🎉 Quá trình restore hoàn tất 100%!"
