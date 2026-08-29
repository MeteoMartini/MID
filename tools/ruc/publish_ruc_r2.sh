#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${MID_RUC_OUTPUT_DIR:-.ruc-out}"
BUCKET="${MID_RUC_R2_BUCKET:-${BUCKET:-}}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-${ACCOUNT_ID:-}}"
RETAIN_RUNS="${MID_RUC_RETAIN_RUNS:-4}"

fail(){ printf 'MID RUC publish: %s\n' "$*" >&2; exit 1; }
command -v aws >/dev/null 2>&1 || fail 'aws CLI missing'
test -d "$OUT_DIR" || fail "output directory missing: $OUT_DIR"
test -n "${AWS_ACCESS_KEY_ID:-}" || fail 'AWS_ACCESS_KEY_ID missing'
test -n "${AWS_SECRET_ACCESS_KEY:-}" || fail 'AWS_SECRET_ACCESS_KEY missing'
test -n "$ACCOUNT_ID" || fail 'CLOUDFLARE_ACCOUNT_ID missing'
test -n "$BUCKET" || fail 'MID_RUC_R2_BUCKET missing'
[[ "$RETAIN_RUNS" =~ ^[0-9]+$ ]] && (( RETAIN_RUNS >= 2 )) || fail 'MID_RUC_RETAIN_RUNS must be >= 2'

ENDPOINT="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
RUN="$(python - "$OUT_DIR/latest.json" <<'PY'
import json,re,sys
run=str(json.load(open(sys.argv[1],encoding='utf-8')).get('run',''))
if not re.fullmatch(r'[0-9A-Za-z_-]+',run):
    raise SystemExit('invalid run key')
print(run)
PY
)"

objects=(deterministic.bin eps-summary.bin eps-members.bin lookup.bin)
for name in "${objects[@]}" latest.json; do
  test -s "$OUT_DIR/$name" || fail "generated object missing/empty: $name"
done

head_size(){
  aws s3api head-object --bucket "$BUCKET" --key "$1" --endpoint-url "$ENDPOINT" --query ContentLength --output text 2>/dev/null || true
}
local_size(){ wc -c < "$1" | tr -d ' '; }
remote_object_matches(){
  local key="$1" file="$2" expected actual
  expected="$(local_size "$file")"; actual="$(head_size "$key")"
  [[ "$actual" =~ ^[0-9]+$ ]] && [[ "$actual" == "$expected" ]]
}

# Idempotency: if latest already targets this run and every immutable object has
# the expected size, skip Class-A writes entirely.
remote_latest="$(mktemp)"; trap 'rm -f "$remote_latest"' EXIT
remote_run=''
if aws s3 cp "s3://${BUCKET}/latest.json" "$remote_latest" --endpoint-url "$ENDPOINT" --only-show-errors >/dev/null 2>&1; then
  remote_run="$(python - "$remote_latest" <<'PY' 2>/dev/null || true
import json,sys
try: print(str(json.load(open(sys.argv[1],encoding='utf-8')).get('run','')))
except Exception: pass
PY
)"
  if [[ "$remote_run" == "$RUN" ]]; then
    all_match=1
    for name in "${objects[@]}"; do
      remote_object_matches "runs/${RUN}/${name}" "$OUT_DIR/$name" || all_match=0
    done
    if (( all_match )); then
      printf 'MID RUC publish: run %s already complete; no upload needed.\n' "$RUN"
      exit 0
    fi
  fi
fi

# Preflight leak guard: a previous job can be interrupted after immutable run uploads
# but before latest.json switches. Before adding another large run, keep the currently
# published fallback plus only the newest other prefixes up to RETAIN_RUNS. This bounds
# storage even when pointer publication repeatedly fails. Never delete remote_run here.
mapfile -t pre_runs < <(aws s3 ls "s3://${BUCKET}/runs/" --endpoint-url "$ENDPOINT" 2>/dev/null | awk '{print $2}' | tr -d '/' | grep -E '^[0-9A-Za-z_-]+$' | sort -r)
if (( ${#pre_runs[@]} > RETAIN_RUNS )); then
  declare -A keep_runs=()
  kept=0
  if [[ -n "$remote_run" ]]; then keep_runs["$remote_run"]=1; kept=1; fi
  for candidate in "${pre_runs[@]}"; do
    [[ -n "${keep_runs[$candidate]:-}" ]] && continue
    if (( kept < RETAIN_RUNS )); then keep_runs["$candidate"]=1; ((kept+=1)); fi
  done
  for old in "${pre_runs[@]}"; do
    [[ -n "${keep_runs[$old]:-}" ]] && continue
    aws s3 rm "s3://${BUCKET}/runs/${old}/" --recursive --endpoint-url "$ENDPOINT" --only-show-errors
    printf 'MID RUC publish: preflight removed orphan/stale run %s\n' "$old"
  done
fi

# Run objects are immutable. Upload all of them before touching latest.json.
for name in "${objects[@]}"; do
  key="runs/${RUN}/${name}"
  if remote_object_matches "$key" "$OUT_DIR/$name"; then
    printf 'MID RUC publish: reuse verified %s\n' "$key"
    continue
  fi
  aws s3 cp "$OUT_DIR/$name" "s3://${BUCKET}/${key}" \
    --endpoint-url "$ENDPOINT" --only-show-errors \
    --content-type application/octet-stream \
    --cache-control 'public,max-age=31536000,immutable'
  remote_object_matches "$key" "$OUT_DIR/$name" || fail "remote size verification failed: $key"
done

# Verify the JSON itself before publication. Consumers can therefore only switch
# from one fully present run to another fully present run.
python - "$OUT_DIR/latest.json" "$RUN" <<'PY'
import json,sys
meta=json.load(open(sys.argv[1],encoding='utf-8'))
assert meta.get('schema')=='mid.dwd.ruc.grid.v2'
assert str(meta.get('run'))==sys.argv[2]
for key in ('deterministic','epsSummary','eps','lookup'):
    item=meta.get(key) or {}
    assert str(item.get('key','')).startswith(f'runs/{sys.argv[2]}/'), (key,item)
objects=meta.get('objects') or {}
assert all(name in objects for name in ('deterministic.bin','eps-summary.bin','eps-members.bin','lookup.bin'))
PY

# Atomic pointer switch. R2 object replacement is atomic; latest is always last.
aws s3 cp "$OUT_DIR/latest.json" "s3://${BUCKET}/latest.json" \
  --endpoint-url "$ENDPOINT" --only-show-errors \
  --content-type application/json \
  --cache-control 'no-cache,max-age=0,must-revalidate'
remote_object_matches 'latest.json' "$OUT_DIR/latest.json" || fail 'latest.json size verification failed'

# Keep a bounded history. Deletion happens only after latest points at the newly
# verified complete run, so cleanup can never make an incomplete run current.
mapfile -t runs < <(aws s3 ls "s3://${BUCKET}/runs/" --endpoint-url "$ENDPOINT" 2>/dev/null | awk '{print $2}' | tr -d '/' | grep -E '^[0-9A-Za-z_-]+$' | sort -r)
if (( ${#runs[@]} > RETAIN_RUNS )); then
  for old in "${runs[@]:RETAIN_RUNS}"; do
    [[ "$old" == "$RUN" ]] && continue
    aws s3 rm "s3://${BUCKET}/runs/${old}/" --recursive --endpoint-url "$ENDPOINT" --only-show-errors
    printf 'MID RUC publish: removed old run %s\n' "$old"
  done
fi
printf 'MID RUC publish: atomically published %s; retained newest %s runs.\n' "$RUN" "$RETAIN_RUNS"
