import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Rating,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import axios from "axios";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/ko";
import { alpha, useTheme } from "@mui/material/styles";

import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import { useAssets } from "../../../entities/asset/model/useAssets";
import classificationApi from "../../../entities/category/api/classificationApi";
import type { ClassificationResponse } from "../../../entities/category/api/classification.types";
import categoryApi from "../../../entities/category/api/categoryApi";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import transactionApi from "../../../entities/transaction/api/transactionApi";
import type { TransactionCreateRequestDto } from "../../../entities/transaction/api/transaction.types";

/** 분류명 → 한글 라벨 */
const TYPE_LABEL: Record<string, string> = {
  INCOME: "수입",
  EXPENSE: "지출",
  TRANSFER: "이체",
};

/** 분류명 → MUI 색상 팔레트 키 */
const TYPE_PALETTE = (name: string, theme: ReturnType<typeof import("@mui/material/styles").useTheme>) => {
  if (name === "INCOME")   return theme.palette.success;
  if (name === "TRANSFER") return theme.palette.info;
  return theme.palette.error; // EXPENSE + fallback
};

dayjs.locale("ko");

const QUICK_AMOUNTS = [
  { label: "+1천", value: 1_000 },
  { label: "+5천", value: 5_000 },
  { label: "+1만", value: 10_000 },
  { label: "+5만", value: 50_000 },
  { label: "+10만", value: 100_000 },
];

const getApiErrorMessage = (payload: unknown): string | null => {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }
  return null;
};

interface TransactionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const TransactionCreateModal: React.FC<TransactionCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const { currentAccountBook } = useAccountBookContext();

  const [type, setType] = useState<string>("EXPENSE");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<number | "">("");
  const [description, setDescription] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<Dayjs>(dayjs());
  const [assetSeq, setAssetSeq] = useState<number | "">("");
  const [satisfactionRating, setSatisfactionRating] = useState<number | null>(null);
  const [classifications, setClassifications] = useState<ClassificationResponse[]>([]);
  const [categories, setCategories] = useState<CategoryListItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { assets } = useAssets(currentAccountBook?.id ?? null);

  // 모달 열릴 때 분류 목록 로드
  useEffect(() => {
    if (!isOpen) { setClassifications([]); return; }
    void classificationApi.getClassifications(currentAccountBook?.id).then((list) => {
      setClassifications(list);
      // 첫 번째 분류로 초기 타입 설정
      if (list.length > 0) setType(list[0].name);
    }).catch(() => {
      // 실패 시 기본값 유지
    });
  }, [isOpen, currentAccountBook?.id]);

  // 카테고리 목록: type 변경마다 재조회
  useEffect(() => {
    if (!isOpen) { setCategories([]); return; }
    const fetch = async () => {
      if (!currentAccountBook?.id) { setCategories([]); return; }
      try {
        const res = await categoryApi.getCategories(currentAccountBook.id, type as "INCOME" | "EXPENSE" | "TRANSFER");
        setCategories(res ?? []);
        setCategory("");
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          setError(`카테고리 조회 실패: ${getApiErrorMessage(err.response.data) ?? err.message}`);
        }
      }
    };
    void fetch();
  }, [isOpen, type, currentAccountBook?.id]);

  const handleClose = () => {
    setType("EXPENSE");
    setAmount("");
    setCategory("");
    setDescription("");
    setTransactionDate(dayjs());
    setAssetSeq("");
    setSatisfactionRating(null);
    setClassifications([]);
    setCategories([]);
    setLoading(false);
    setError(null);
    onClose();
  };

  const handleAddQuickAmount = (value: number) => {
    setAmount((prev) => String((parseInt(prev || "0", 10) + value)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentAccountBook?.id) {
      setError("가계부를 먼저 선택해 주세요.");
      return;
    }
    const parsed = parseInt(amount, 10);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("금액을 올바르게 입력해 주세요.");
      return;
    }
    if (category === "") {
      setError("카테고리를 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const req: TransactionCreateRequestDto = {
        accountBookSeq: currentAccountBook.id,
        type,
        amount: parsed,
        categorySeq: category,
        description,
        transactionDate: transactionDate.second(0).format("YYYYMMDDHHmmss"),
        assetSeq: assetSeq !== "" ? assetSeq : undefined,
        satisfactionRating: satisfactionRating ?? undefined,
      };
      await transactionApi.createTransaction(req);
      await onSuccess();
      handleClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(`거래 추가 실패: ${getApiErrorMessage(err.response.data) ?? err.message}`);
      } else {
        setError("거래를 추가하는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const typeColor = TYPE_PALETTE(type, theme);
  const canSubmit = !!amount && parseInt(amount, 10) > 0 && category !== "";

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      // 모바일: 하단에서 올라오는 바텀시트, 데스크톱: 중앙 다이얼로그
      sx={{
        "& .MuiDialog-container": {
          alignItems: { xs: "flex-end", sm: "center" },
        },
      }}
      PaperProps={{
        component: "form",
        onSubmit: (e: React.FormEvent) => void handleSubmit(e),
        sx: {
          m: { xs: 0, sm: 2 },
          width: { xs: "100%", sm: 440 },
          maxWidth: { xs: "100%", sm: 440 },
          maxHeight: { xs: "92vh", sm: "88vh" },
          borderRadius: { xs: "20px 20px 0 0", sm: 3 },
          overflowY: "auto",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* 모바일 드래그 핸들 */}
        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            justifyContent: "center",
            pt: 1.5,
            pb: 0.5,
          }}
        >
          <Box
            sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "action.disabled" }}
          />
        </Box>

        <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 3 }, pt: { xs: 1, sm: 2.5 } }}>
          {/* 제목 */}
          <Typography variant="h6" fontWeight={700} mb={2.5}>
            거래 추가
          </Typography>

          {/* ── 1. 유형 토글 (분류 DB 기반 동적 렌더링) ── */}
          <ToggleButtonGroup
            value={type}
            exclusive
            onChange={(_, v: string | null) => {
              if (v) { setType(v); setCategory(""); }
            }}
            fullWidth
            sx={{
              mb: 2.5,
              flexWrap: "wrap",
              "& .MuiToggleButton-root": {
                flex: 1,
                py: 1.25,
                fontSize: "0.95rem",
                fontWeight: 700,
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "10px !important",
                transition: "all 0.15s ease",
                "&.Mui-selected": { borderWidth: "1.5px" },
              },
              gap: 1.5,
            }}
          >
            {(classifications.length > 0
              ? classifications
              : [{ id: -1, name: "EXPENSE" }, { id: -2, name: "INCOME" }] as ClassificationResponse[]
            ).map((cls) => {
              const pal = TYPE_PALETTE(cls.name, theme);
              return (
                <ToggleButton
                  key={cls.name}
                  value={cls.name}
                  sx={{
                    "&.Mui-selected": {
                      bgcolor: alpha(pal.main, 0.1),
                      color: pal.main,
                      borderColor: `${pal.main} !important`,
                    },
                  }}
                >
                  {TYPE_LABEL[cls.name] ?? cls.name}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>

          {/* ── 2. 금액 입력 ── */}
          <Box mb={2}>
            <TextField
              fullWidth
              label="금액"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputProps={{ min: 0, style: { fontSize: "1.3rem", fontWeight: 800 } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography fontWeight={600} color="text.secondary">원</Typography>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />
            {/* 빠른 금액 칩 */}
            <Box display="flex" gap={0.75} flexWrap="wrap">
              {QUICK_AMOUNTS.map(({ label, value }) => (
                <Chip
                  key={value}
                  label={label}
                  size="small"
                  onClick={() => handleAddQuickAmount(value)}
                  sx={{
                    cursor: "pointer",
                    fontWeight: 600,
                    bgcolor: alpha(typeColor.main, 0.08),
                    color: typeColor.dark,
                    border: "1px solid",
                    borderColor: alpha(typeColor.main, 0.25),
                    "&:hover": { bgcolor: alpha(typeColor.main, 0.15) },
                  }}
                />
              ))}
              {amount && (
                <Chip
                  label="초기화"
                  size="small"
                  variant="outlined"
                  onClick={() => setAmount("")}
                  sx={{ cursor: "pointer" }}
                />
              )}
            </Box>
          </Box>

          {/* ── 3. 카테고리 칩 그리드 ── */}
          <Box mb={2}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              카테고리
            </Typography>
            {categories.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
                카테고리가 없습니다. 먼저 카테고리를 추가해 주세요.
              </Typography>
            ) : (
              <Box
                display="flex"
                gap={0.75}
                flexWrap="wrap"
                sx={{ maxHeight: 120, overflowY: "auto", pr: 0.5 }}
              >
                {categories.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <Chip
                      key={cat.id}
                      label={cat.name}
                      onClick={() => setCategory(cat.id)}
                      sx={{
                        cursor: "pointer",
                        fontWeight: isSelected ? 700 : 500,
                        bgcolor: isSelected
                          ? alpha(typeColor.main, 0.15)
                          : "action.hover",
                        color: isSelected ? typeColor.dark : "text.primary",
                        border: "1.5px solid",
                        borderColor: isSelected
                          ? alpha(typeColor.main, 0.5)
                          : "transparent",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          bgcolor: alpha(typeColor.main, 0.1),
                        },
                      }}
                    />
                  );
                })}
              </Box>
            )}
          </Box>

          {/* ── 4. 설명 (선택) ── */}
          <TextField
            fullWidth
            label="설명 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />

          {/* ── 5. 자산 연동 (선택) ── */}
          {assets.length > 0 && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>자산 연동 (선택)</InputLabel>
              <Select
                value={assetSeq}
                label="자산 연동 (선택)"
                onChange={(e) => setAssetSeq(e.target.value as number | "")}
              >
                <MenuItem value="">연동 안 함</MenuItem>
                {assets.map((a) => (
                  <MenuItem key={a.seq} value={a.seq}>
                    {a.name} ({a.balance.toLocaleString("ko-KR")}원)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* ── 5-2. 소비 만족도 (선택) ── */}
          <Box mb={2}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ display: "block", mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              소비 만족도 (선택)
            </Typography>
            <Rating
              value={satisfactionRating}
              onChange={(_, v) => setSatisfactionRating(v)}
              size="large"
            />
            {satisfactionRating && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                {["", "후회됨", "아쉬움", "보통", "만족", "매우 만족"][satisfactionRating]}
              </Typography>
            )}
          </Box>

          {/* ── 6. 날짜 ── */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="날짜"
              value={transactionDate}
              format="YYYY년 M월 D일"
              onChange={(v) => { if (v) setTransactionDate(v); }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  sx: { mb: 2.5 },
                },
              }}
            />
          </LocalizationProvider>

          {/* 에러 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* ── 6. 제출 버튼 ── */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !canSubmit}
            sx={{
              py: 1.5,
              fontWeight: 700,
              fontSize: "1rem",
              borderRadius: 2,
              bgcolor: canSubmit ? typeColor.main : undefined,
              "&:hover": { bgcolor: canSubmit ? typeColor.dark : undefined },
              transition: "background-color 0.2s ease",
            }}
          >
            {loading ? (
              <CircularProgress size={22} sx={{ color: "inherit" }} />
            ) : (
              `${TYPE_LABEL[type] ?? type} ${amount && parseInt(amount, 10) > 0 ? parseInt(amount, 10).toLocaleString("ko-KR") + "원 추가" : "추가"}`
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionCreateModal;
