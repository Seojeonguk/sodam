import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  AddCircleOutline,
  Close,
  FileUploadOutlined,
  InsertDriveFileOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import categoryApi, {
  type CategoryCreateRequest,
} from "../../../entities/category/api/categoryApi";
import { useClassifications } from "../../../entities/category/model/useClassifications";
import { FALLBACK_CLASSIFICATIONS, TYPE_LABEL } from "../../../entities/category/lib/classificationUtils";
import { getUserSeq } from "../../../shared/lib/userSync";
import { supabase } from "../../../shared/lib/supabase";
import { toDateKey } from "../../../shared/lib/date";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type RowStatus = "ready" | "skip" | "duplicate" | "done" | "error";

interface ParsedRow {
  /** YYYYMMDDHHMMSS */
  date: string;
  /** null = 미지정 (이체 등 알 수 없는 타입) */
  type: "INCOME" | "EXPENSE" | null;
  /** 원본 타입 문자열 (이체, 환불 등) */
  rawType: string;
  description: string;
  amount: number;
  categoryName: string;
  categorySeq: number | null;
  memo: string;
  status: RowStatus;
  errorMsg?: string;
}

const COL = {
  날짜: 0, 시간: 1, 타입: 2, 대분류: 3, 소분류: 4,
  내용: 5, 금액: 6, 화폐: 7, 결제수단: 8, 메모: 9,
} as const;

/** Excel 셀 값 → 날짜 문자열 "YYYY-MM-DD" */
function toDateStr(raw: unknown): string {
  if (raw instanceof Date) return dayjs(raw).format("YYYY-MM-DD");
  const s = String(raw ?? "").trim();
  if (!s) return dayjs().format("YYYY-MM-DD");
  // 이미 YYYY-MM-DD 형식이면 그대로
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

/** Excel 셀 값 → 시간 문자열 "HH:mm" */
function toTimeStr(raw: unknown): string {
  if (raw instanceof Date) return dayjs(raw).format("HH:mm");
  const s = String(raw ?? "").trim();
  if (!s) return "00:00";
  return s;
}

function parseExcelRows(sheet: XLSX.WorkSheet): ParsedRow[] {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,   // 날짜를 포맷된 문자열로 읽기
  });

  // 헤더 행 찾기
  const headerIdx = raw.findIndex(
    (r) => Array.isArray(r) && (String(r[0]).includes("날짜") || String(r[1]).includes("시간")),
  );
  const dataRows = (headerIdx >= 0 ? raw.slice(headerIdx + 1) : raw.slice(1)) as unknown[][];

  return dataRows
    .filter((r) => r.length > 0 && String(r[COL.날짜] ?? "").trim())
    .map((r) => {
      const dateStr  = toDateStr(r[COL.날짜]);
      const timeStr  = toTimeStr(r[COL.시간]);
      const typeRaw  = String(r[COL.타입] ?? "").trim();
      const subCat   = String(r[COL.대분류] ?? "").trim();
      const desc     = String(r[COL.내용]  ?? "").trim();
      const amtRaw   = r[COL.금액];
      const memo     = String(r[COL.메모]  ?? "").trim();

      // 날짜 + 시간 → YYYYMMDDHHmmss
      const combined = dayjs(`${dateStr} ${timeStr || "00:00"}`);
      const datetime = combined.isValid()
        ? combined.format("YYYYMMDDHHmmss")
        : toDateKey(dayjs(dateStr)) + "000000";

      // 타입 매핑
      const type: "INCOME" | "EXPENSE" | null =
        typeRaw === "수입" ? "INCOME"
        : typeRaw === "지출" ? "EXPENSE"
        : null; // 이체·환불 등 → 미지정

      // 금액 (절댓값)
      const amount = Math.abs(Number(String(amtRaw).replace(/,/g, "")) || 0);

      // 대분류가 "내계좌이체"인 행은 파싱 단계에서 바로 스킵
      const isTransfer = subCat === "내계좌이체";

      return {
        date: datetime,
        type,
        rawType: typeRaw,
        description: desc,
        amount,
        categoryName: subCat,
        categorySeq: null,
        memo,
        status: isTransfer ? "skip" : "ready",
      } satisfies ParsedRow;
    });
}

export default function TransactionImportModal({ open, onClose, onSuccess }: Props) {
  const theme = useTheme();
  const { currentAccountBook } = useAccountBookContext();
  const { classifications } = useClassifications(currentAccountBook?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  // ── 미지정 타입 처리 ──────────────────────────────────────────
  const [typeMap, setTypeMap] = useState<Record<string, "INCOME" | "EXPENSE" | "skip">>({});

  // ── 미매칭 카테고리 처리 ─────────────────────────────────────
  const [newCatTypes, setNewCatTypes] = useState<Record<string, "INCOME" | "EXPENSE">>({});
  const [creatingCats, setCreatingCats] = useState<Set<string>>(new Set());
  const [createdCats, setCreatedCats] = useState<Set<string>>(new Set());

  // 미리보기 테이블 페이지네이션
  const [previewPage, setPreviewPage] = useState(0);
  const PREVIEW_PAGE_SIZE = 100;

  // 파싱 시점의 기존 거래 키 Set (import 직전 재검증용)
  const dupSetRef = useRef<Set<string>>(new Set());

  // ── 파생 값 (메모이제이션) ───────────────────────────────────
  const effectiveRows = useMemo(() => rows.map((r) => {
    // 파싱 단계에서 확정된 상태(skip 포함)는 타입맵으로 덮어쓰지 않음
    if (r.status === "skip" || r.status === "duplicate" || r.status === "done" || r.status === "error") return r;
    if (r.type !== null) return r;
    const mapped = typeMap[r.rawType];
    if (mapped === "INCOME" || mapped === "EXPENSE")
      return { ...r, type: mapped, status: "ready" as RowStatus };
    return { ...r, type: null, status: "skip" as RowStatus };
  }), [rows, typeMap]);

  const readyCount = useMemo(() => effectiveRows.filter((r) => r.status === "ready").length, [effectiveRows]);
  const skipCount  = useMemo(() => effectiveRows.filter((r) => r.status === "skip").length,  [effectiveRows]);
  const dupCount   = useMemo(() => rows.filter((r) => r.status === "duplicate").length,       [rows]);
  const doneCount  = useMemo(() => rows.filter((r) => r.status === "done").length,            [rows]);
  const errorCount = useMemo(() => rows.filter((r) => r.status === "error").length,           [rows]);

  const unknownTypes = useMemo(() => [...new Set(
    rows.filter((r) => r.type === null && r.status !== "skip").map((r) => r.rawType).filter(Boolean)
  )], [rows]);

  const unmatchedCats = useMemo(() => [...new Set(
    rows
      .filter((r) => r.categoryName && r.categorySeq === null && !createdCats.has(r.categoryName))
      .map((r) => r.categoryName)
  )], [rows, createdCats]);

  // 현재 페이지에 표시할 행 (렌더링 부하 분산)
  const pagedRows = useMemo(() => {
    const start = previewPage * PREVIEW_PAGE_SIZE;
    return effectiveRows.slice(start, start + PREVIEW_PAGE_SIZE);
  }, [effectiveRows, previewPage]);

  const totalPages = Math.ceil(effectiveRows.length / PREVIEW_PAGE_SIZE);

  // ── 파일 파싱 ────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setDone(false);
    setProgress(0);
    setFileName(file.name);
    setTypeMap({});
    setNewCatTypes({});
    setCreatingCats(new Set());
    setCreatedCats(new Set());
    setPreviewPage(0);
    dupSetRef.current = new Set();

    try {
      const buffer = await file.arrayBuffer();
      // raw: false → 날짜 셀을 포맷된 문자열로 변환 (시리얼 숫자 문제 방지)
      const wb = XLSX.read(buffer, { type: "array", cellDates: false, raw: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const parsed = parseExcelRows(ws);

      if (parsed.length === 0) {
        setParseError("데이터 행을 찾을 수 없습니다. 파일 형식을 확인해 주세요.");
        return;
      }

      // 카테고리 자동 매칭
      try {
        if (!currentAccountBook) throw new Error("가계부가 선택되지 않았습니다.");
        const cats = await categoryApi.getCategories(currentAccountBook.id);
        const catMap = new Map(cats.map((c) => [c.name, c.id]));
        parsed.forEach((row) => {
          if (row.categoryName && catMap.has(row.categoryName)) {
            row.categorySeq = catMap.get(row.categoryName)!;
          }
        });
        // 새 카테고리 타입 초기값 (해당 카테고리를 쓰는 거래의 다수 타입으로 추론)
        const catTypeInit: Record<string, "INCOME" | "EXPENSE"> = {};
        const unmatched = [...new Set(parsed.filter((r) => r.categoryName && r.categorySeq === null).map((r) => r.categoryName))];
        for (const name of unmatched) {
          const rowsWithCat = parsed.filter((r) => r.categoryName === name && r.type !== null);
          const incomeCount  = rowsWithCat.filter((r) => r.type === "INCOME").length;
          const expenseCount = rowsWithCat.filter((r) => r.type === "EXPENSE").length;
          catTypeInit[name] = incomeCount > expenseCount ? "INCOME" : "EXPENSE";
        }
        setNewCatTypes(catTypeInit);
      } catch { /* 매칭 실패해도 계속 */ }

      // ── 중복 체크 ───────────────────────────────────────────
      // amount + transaction_date + type + description 4개 필드가 모두 같으면 중복으로 판정
      if (currentAccountBook) {
        try {
          const { data: existing } = await supabase
            .from("transaction")
            .select("amount, transaction_date, type, description")
            .eq("account_book_seq", currentAccountBook.id);

          if (existing && existing.length > 0) {
            const dupSet = new Set(
              existing.map((row) => {
                const e = row as Record<string, unknown>;
                const amount = e.amount as number;
                const transactionDate = e.transaction_date as string;
                const type = e.type as string;
                return `${amount}|${transactionDate}|${type}|${String(e.description ?? "").trim()}`;
              })
            );
            // ref에 저장 → import 직전 재검증에 사용
            dupSetRef.current = dupSet;
            parsed.forEach((row) => {
              const fullDesc = row.memo
                ? `${row.description} (${row.memo})`
                : row.description;
              // 파싱 시점엔 type이 null일 수 있으므로 null 키로 먼저 체크
              const key = `${row.amount}|${row.date}|${row.type}|${fullDesc}`;
              if (dupSet.has(key)) {
                row.status = "duplicate";
              }
            });
          }
        } catch { /* 중복 체크 실패해도 계속 */ }
      }

      setRows(parsed);
    } catch {
      setParseError("파일을 읽는 중 오류가 발생했습니다. xlsx / xls / csv 형식을 지원합니다.");
    }

    e.target.value = "";
  };

  // ── 랜덤 색상 ────────────────────────────────────────────────
  const PALETTE = [
    "#EF5350","#EC407A","#AB47BC","#7E57C2","#42A5F5",
    "#26C6DA","#26A69A","#66BB6A","#D4E157","#FFA726",
    "#FF7043","#8D6E63","#78909C","#5C6BC0","#29B6F6",
  ];
  const randomColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

  // ── 카테고리 생성 ────────────────────────────────────────────
  const handleCreateCategory = async (name: string) => {
    if (!currentAccountBook) return;
    const type = newCatTypes[name] ?? "EXPENSE";
    setCreatingCats((prev) => new Set(prev).add(name));
    try {
      const req: CategoryCreateRequest = {
        name, type, color: randomColor(), accountBookSeq: currentAccountBook.id,
      };
      const created = await categoryApi.createCategory(req);
      // rows의 해당 카테고리 자동 매칭
      setRows((prev) =>
        prev.map((r) =>
          r.categoryName === name ? { ...r, categorySeq: created.id } : r
        )
      );
      setCreatedCats((prev) => new Set(prev).add(name));
    } catch (err) {
      alert(err instanceof Error ? err.message : "카테고리 생성 실패");
    } finally {
      setCreatingCats((prev) => { const s = new Set(prev); s.delete(name); return s; });
    }
  };

  // ── 미매칭 카테고리 전체 생성 ─────────────────────────────────
  const [creatingAll, setCreatingAll] = useState(false);

  const handleCreateAllCategories = async () => {
    const targets = unmatchedCats.filter((n) => !creatingCats.has(n));
    if (targets.length === 0) return;
    setCreatingAll(true);
    try {
      for (const name of targets) {
        await handleCreateCategory(name);
      }
    } finally {
      setCreatingAll(false);
    }
  };

  // ── 가져오기 실행 ────────────────────────────────────────────
  const BATCH_SIZE = 100;

  const handleImport = async () => {
    if (!currentAccountBook) return;
    setImporting(true);
    setDone(false);

    const userSeq = await getUserSeq();
    const ts = dayjs().format("YYYYMMDDHHmmss");

    // ── import 직전 최종 중복 재검증 ───────────────────────────
    // 파싱 시점엔 type이 null이어서 못 잡았던 케이스(이체→EXPENSE 매핑 등)를
    // effectiveRows(타입 확정 후)로 다시 검사해 dupSetRef와 대조
    const finalDupSet = dupSetRef.current;
    const updated0 = [...rows];
    effectiveRows.forEach((row, i) => {
      if (row.status !== "ready" || finalDupSet.size === 0) return;
      const fullDesc = row.memo ? `${row.description} (${row.memo})` : row.description;
      const key = `${row.amount}|${row.date}|${row.type}|${fullDesc}`;
      if (finalDupSet.has(key)) {
        updated0[i] = { ...updated0[i], status: "duplicate" };
      }
    });
    setRows(updated0);

    // (effectiveRow, 원본 rows 인덱스) 쌍으로 묶어서 ready 행만 추림
    // 재검증 후 duplicate로 바뀐 행은 자동 제외됨
    const toImport = updated0
      .map((r, i) => ({ row: effectiveRows[i], idx: i }))
      .filter(({ row }) => row.status === "ready" && !finalDupSet.has(
        `${row.amount}|${row.date}|${row.type}|${row.memo ? `${row.description} (${row.memo})` : row.description}`
      ));

    const updated = [...rows];
    let completed = 0;

    // BATCH_SIZE 단위로 잘라 배치 insert
    for (let start = 0; start < toImport.length; start += BATCH_SIZE) {
      const chunk = toImport.slice(start, start + BATCH_SIZE);

      const payload = chunk.map(({ row }) => ({
        account_book_seq: currentAccountBook.id,
        user_seq: userSeq,
        category_seq: row.categorySeq,
        amount: row.amount,
        description: row.memo
          ? `${row.description} (${row.memo})`
          : row.description,
        transaction_date: row.date,
        type: row.type,
        satisfaction_rating: 0,
        created_at: ts,
        updated_at: ts,
      }));

      const { error } = await supabase.from("transaction").insert(payload);

      for (const { idx } of chunk) {
        updated[idx] = error
          ? { ...updated[idx], status: "error", errorMsg: error.message }
          : { ...updated[idx], status: "done" };
      }

      completed += chunk.length;
      setProgress(Math.round((completed / toImport.length) * 100));
      setRows([...updated]);
    }

    setImporting(false);
    setDone(true);
    onSuccess();
  };

  const handleClose = () => {
    if (importing) return;
    setRows([]);
    setFileName(null);
    setParseError(null);
    setDone(false);
    setProgress(0);
    setTypeMap({});
    setNewCatTypes({});
    setCreatingCats(new Set());
    setCreatedCats(new Set());
    setPreviewPage(0);
    dupSetRef.current = new Set();
    onClose();
  };

  const statusChip = (row: ParsedRow, effective: ParsedRow) => {
    if (row.status === "duplicate")
      return <Chip label="중복" size="small" color="warning" sx={{ fontSize: "0.65rem" }} />;
    if (effective.status === "skip")
      return <Chip label="건너뜀" size="small" color="default" sx={{ fontSize: "0.65rem" }} />;
    if (row.status === "done")
      return <Chip label="완료" size="small" color="success" sx={{ fontSize: "0.65rem" }} />;
    if (row.status === "error")
      return <Chip label="오류" size="small" color="error" sx={{ fontSize: "0.65rem" }} />;
    return <Chip label="대기" size="small" color="primary" variant="outlined" sx={{ fontSize: "0.65rem" }} />;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      sx={{
        alignItems: { xs: "flex-end", sm: "center" },
        "& .MuiDialog-paper": {
          m: { xs: 0, sm: 2 },
          width: "100%",
          borderRadius: { xs: "16px 16px 0 0", sm: 3 },
          maxHeight: { xs: "92vh", sm: "88vh" },
        },
      }}
    >
      <DialogTitle
        sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0.5 }}
      >
        엑셀 파일 가져오기
        <IconButton size="small" onClick={handleClose} disabled={importing} aria-label="닫기">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>

          {/* ── 파일 업로드 영역 ── */}
          <Box
            onClick={() => !importing && fileInputRef.current?.click()}
            sx={{
              border: "2px dashed",
              borderColor: fileName
                ? alpha(theme.palette.primary.main, 0.5)
                : alpha(theme.palette.divider, 0.8),
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              cursor: importing ? "default" : "pointer",
              bgcolor: fileName ? alpha(theme.palette.primary.main, 0.04) : "transparent",
              transition: "all 0.2s",
              "&:hover": importing ? {} : {
                borderColor: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.06),
              },
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={(e) => void handleFileChange(e)}
            />
            {fileName ? (
              <Stack alignItems="center" spacing={0.5}>
                <InsertDriveFileOutlined color="primary" sx={{ fontSize: 36 }} />
                <Typography fontWeight={700} color="primary.main">{fileName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  클릭하면 다른 파일을 선택할 수 있습니다
                </Typography>
              </Stack>
            ) : (
              <Stack alignItems="center" spacing={0.5}>
                <FileUploadOutlined sx={{ fontSize: 36, color: "text.disabled" }} />
                <Typography fontWeight={700} color="text.secondary">
                  엑셀 파일을 클릭하여 선택하세요
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  .xlsx · .xls · .csv 지원 &nbsp;|&nbsp; 필수 컬럼: 날짜 · 시간 · 타입 · 소분류 · 내용 · 금액
                </Typography>
              </Stack>
            )}
          </Box>

          {parseError && <Alert severity="error">{parseError}</Alert>}

          {/* ── 미지정 타입 처리 ── */}
          <Collapse in={unknownTypes.length > 0 && !done}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: alpha(theme.palette.warning.main, 0.4),
                bgcolor: alpha(theme.palette.warning.main, 0.04),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <WarningAmberOutlined sx={{ fontSize: "1rem", color: "warning.main" }} />
                <Typography variant="body2" fontWeight={700} color="warning.dark">
                  인식되지 않은 타입 — INCOME / EXPENSE 중 선택하거나 건너뜁니다
                </Typography>
              </Stack>
              <Stack spacing={1}>
                {unknownTypes.map((rawType) => {
                  const cnt = rows.filter((r) => r.rawType === rawType).length;
                  const current = typeMap[rawType] ?? "skip";
                  return (
                    <Stack key={rawType} direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 600 }}>
                        {rawType}
                        <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                          ({cnt}건)
                        </Typography>
                      </Typography>
                      <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={current}
                        onChange={(_, v) => {
                          if (v) setTypeMap((prev) => ({ ...prev, [rawType]: v as "INCOME" | "EXPENSE" | "TRANSFER" | "skip" }));
                        }}
                        sx={{ "& .MuiToggleButton-root": { px: 1.5, py: 0.4, textTransform: "none", fontSize: "0.75rem", fontWeight: 600 } }}
                      >
                        {(classifications.length > 0 ? classifications : FALLBACK_CLASSIFICATIONS).map((cls) => (
                          <ToggleButton key={cls.name} value={cls.name}>
                            {TYPE_LABEL[cls.name] ?? cls.name}
                          </ToggleButton>
                        ))}
                        <ToggleButton value="skip">건너뜀</ToggleButton>
                      </ToggleButtonGroup>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          </Collapse>

          {/* ── 미매칭 카테고리 생성 ── */}
          <Collapse in={unmatchedCats.length > 0 && !done}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: alpha(theme.palette.info.main, 0.4),
                bgcolor: alpha(theme.palette.info.main, 0.04),
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AddCircleOutline sx={{ fontSize: "1rem", color: "info.main" }} />
                  <Typography variant="body2" fontWeight={700} color="info.dark">
                    매칭되지 않은 카테고리 — 새로 생성하거나 무시합니다
                  </Typography>
                </Stack>
                <Button
                  size="small"
                  variant="contained"
                  color="info"
                  disabled={creatingAll || unmatchedCats.length === 0}
                  onClick={() => void handleCreateAllCategories()}
                  sx={{ fontWeight: 700, textTransform: "none", borderRadius: 1.5, fontSize: "0.75rem", whiteSpace: "nowrap" }}
                >
                  {creatingAll ? <CircularProgress size={14} sx={{ color: "inherit" }} /> : `전체 생성 (${unmatchedCats.length})`}
                </Button>
              </Stack>
              <Stack spacing={1}>
                {unmatchedCats.map((name) => {
                  const catType = newCatTypes[name] ?? "EXPENSE";
                  const creating = creatingCats.has(name);
                  const cnt = rows.filter((r) => r.categoryName === name).length;
                  return (
                    <Stack key={name} direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                        {name}
                        <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                          ({cnt}건)
                        </Typography>
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 90 }}>
                        <InputLabel sx={{ fontSize: "0.75rem" }}>타입</InputLabel>
                        <Select
                          value={catType}
                          label="타입"
                          onChange={(e) =>
                            setNewCatTypes((prev) => ({
                              ...prev,
                              [name]: e.target.value as "INCOME" | "EXPENSE",
                            }))
                          }
                          sx={{ fontSize: "0.75rem", "& fieldset": { borderRadius: 1.5 } }}
                        >
                          {(classifications.length > 0 ? classifications : FALLBACK_CLASSIFICATIONS).map((cls) => (
                            <MenuItem key={cls.name} value={cls.name} sx={{ fontSize: "0.8rem" }}>
                              {TYPE_LABEL[cls.name] ?? cls.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        disabled={creating}
                        onClick={() => void handleCreateCategory(name)}
                        sx={{ fontWeight: 700, textTransform: "none", borderRadius: 1.5, minWidth: 72, fontSize: "0.75rem" }}
                      >
                        {creating ? <CircularProgress size={14} /> : "카테고리 생성"}
                      </Button>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          </Collapse>

          {/* ── 진행률 ── */}
          {importing && (
            <Box>
              <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                저장 중... {progress}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1 }} />
            </Box>
          )}

          {done && (
            <Alert severity={errorCount > 0 ? "warning" : "success"}>
              {doneCount}건 저장 완료
              {skipCount > 0 && ` · ${skipCount}건 건너뜀`}
              {errorCount > 0 && ` · ${errorCount}건 실패`}
            </Alert>
          )}

          {/* ── 미리보기 테이블 ── */}
          {rows.length > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontWeight={700}>
                  미리보기 ({rows.length}행)
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  <Chip label={`대기 ${readyCount}`}  size="small" color="primary" variant="outlined" sx={{ fontSize: "0.65rem" }} />
                  {dupCount   > 0 && <Chip label={`중복 ${dupCount}`}   size="small" color="warning"  sx={{ fontSize: "0.65rem" }} />}
                  <Chip label={`건너뜀 ${skipCount}`} size="small" sx={{ fontSize: "0.65rem" }} />
                  {doneCount  > 0 && <Chip label={`완료 ${doneCount}`}  size="small" color="success"  sx={{ fontSize: "0.65rem" }} />}
                  {errorCount > 0 && <Chip label={`오류 ${errorCount}`} size="small" color="error"    sx={{ fontSize: "0.65rem" }} />}
                </Stack>
              </Stack>

              <TableContainer
                sx={{
                  maxHeight: 280,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "auto",
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {["상태", "날짜", "타입", "내용", "금액", "카테고리"].map((h) => (
                        <TableCell
                          key={h}
                          sx={{ fontWeight: 700, fontSize: "0.72rem", bgcolor: "background.paper", whiteSpace: "nowrap" }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedRows.map((row, pi) => {
                      const i = previewPage * PREVIEW_PAGE_SIZE + pi;
                      return (
                        <TableRow
                          key={i}
                          sx={{
                            opacity: row.status === "skip" || row.status === "duplicate" ? 0.45 : 1,
                            bgcolor:
                              row.status === "done"        ? alpha(theme.palette.success.main, 0.06)
                              : row.status === "error"     ? alpha(theme.palette.error.main,   0.06)
                              : row.status === "duplicate" ? alpha(theme.palette.warning.main, 0.06)
                              : "transparent",
                          }}
                        >
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {statusChip(rows[i], row)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                            {row.date.slice(0,4)}-{row.date.slice(4,6)}-{row.date.slice(6,8)}
                          </TableCell>
                          <TableCell>
                            {row.type ? (
                              <Chip
                                label={row.type === "INCOME" ? "수입" : "지출"}
                                size="small"
                                color={row.type === "INCOME" ? "success" : "error"}
                                sx={{ fontSize: "0.65rem" }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.disabled">{rows[i].rawType || "미지정"}</Typography>
                            )}
                          </TableCell>
                          <TableCell
                            sx={{ fontSize: "0.72rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {row.description}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.72rem", whiteSpace: "nowrap", textAlign: "right" }}>
                            {row.amount.toLocaleString()}원
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.72rem" }}>
                            {row.categorySeq ? (
                              <Chip label={row.categoryName} size="small" variant="outlined" sx={{ fontSize: "0.65rem" }} />
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                {row.categoryName || "없음"}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mt={1}>
                  <Button
                    size="small"
                    disabled={previewPage === 0}
                    onClick={() => setPreviewPage((p) => p - 1)}
                    sx={{ minWidth: 32, fontSize: "0.72rem" }}
                  >
                    ‹
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    {previewPage + 1} / {totalPages}
                    <Typography component="span" variant="caption" color="text.disabled" ml={0.5}>
                      (전체 {effectiveRows.length}행)
                    </Typography>
                  </Typography>
                  <Button
                    size="small"
                    disabled={previewPage >= totalPages - 1}
                    onClick={() => setPreviewPage((p) => p + 1)}
                    sx={{ minWidth: 32, fontSize: "0.72rem" }}
                  >
                    ›
                  </Button>
                </Stack>
              )}
            </Box>
          )}

        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleClose}
          disabled={importing}
          sx={{ fontWeight: 700, textTransform: "none", borderRadius: 1.5 }}
        >
          {done ? "닫기" : "취소"}
        </Button>
        {!done && (
          <Button
            fullWidth
            variant="contained"
            onClick={() => void handleImport()}
            disabled={importing || readyCount === 0 || !currentAccountBook}
            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 1.5 }}
          >
            {importing
              ? <CircularProgress size={18} color="inherit" />
              : `${readyCount}건 가져오기`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
