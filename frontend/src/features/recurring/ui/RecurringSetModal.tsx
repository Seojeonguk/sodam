import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import type { RecurringTransactionRequest, RecurringTransactionResponse } from "../../../entities/recurringTransaction/api/recurring.types";

const QUICK_AMOUNTS = [50000, 100000, 200000, 300000, 500000];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RecurringTransactionRequest) => Promise<void>;
  categories: CategoryListItemResponse[];
  accountBookSeq: number;
  initial?: RecurringTransactionResponse | null;
}

export default function RecurringSetModal({ open, onClose, onSubmit, categories, accountBookSeq, initial }: Props) {
  const theme = useTheme();

  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [categorySeq, setCategorySeq] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  const isEdit = !!initial;

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setType(initial.type);
      setCategorySeq(initial.categorySeq ?? "");
      setAmount(String(initial.amount));
      setDescription(initial.description ?? "");
      setDayOfMonth(initial.dayOfMonth);
    } else {
      setType("EXPENSE");
      setCategorySeq("");
      setAmount("");
      setDescription("");
      setDayOfMonth(1);
    }
  }, [open, initial]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleAddAmount = (val: number) => {
    const current = Number(amount.replace(/,/g, "")) || 0;
    setAmount(String(current + val));
  };

  const handleSubmit = async () => {
    const num = Number(amount.replace(/,/g, ""));
    if (!num || num <= 0) { alert("금액을 입력해주세요."); return; }
    setSaving(true);
    try {
      await onSubmit({
        accountBookSeq,
        categorySeq: categorySeq !== "" ? Number(categorySeq) : null,
        amount: num,
        description: description || undefined,
        type,
        dayOfMonth,
      });
      onClose();
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      sx={{
        alignItems: { xs: "flex-end", sm: "center" },
        "& .MuiDialog-paper": {
          m: { xs: 0, sm: 2 },
          width: "100%",
          borderRadius: { xs: "16px 16px 0 0", sm: 3 },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
        {isEdit ? "반복 거래 수정" : "반복 거래 추가"}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} pt={0.5}>

          {/* 수입/지출 토글 */}
          <ToggleButtonGroup
            value={type}
            exclusive
            onChange={(_, v) => { if (v) { setType(v as "INCOME" | "EXPENSE"); setCategorySeq(""); } }}
            fullWidth
            size="small"
          >
            <ToggleButton
              value="EXPENSE"
              sx={{
                fontWeight: 700, textTransform: "none",
                "&.Mui-selected": { bgcolor: alpha(theme.palette.error.main, 0.12), color: "error.main", borderColor: alpha(theme.palette.error.main, 0.4) },
              }}
            >
              지출
            </ToggleButton>
            <ToggleButton
              value="INCOME"
              sx={{
                fontWeight: 700, textTransform: "none",
                "&.Mui-selected": { bgcolor: alpha(theme.palette.success.main, 0.12), color: "success.main", borderColor: alpha(theme.palette.success.main, 0.4) },
              }}
            >
              수입
            </ToggleButton>
          </ToggleButtonGroup>

          {/* 카테고리 */}
          <FormControl fullWidth size="small">
            <InputLabel>카테고리 (선택)</InputLabel>
            <Select
              value={categorySeq}
              label="카테고리 (선택)"
              onChange={(e) => setCategorySeq(e.target.value as number | "")}
            >
              <MenuItem value=""><em>미분류</em></MenuItem>
              {filteredCategories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 금액 */}
          <TextField
            fullWidth
            size="small"
            label="금액"
            value={amount ? Number(amount.replace(/,/g, "")).toLocaleString("ko-KR") : ""}
            onChange={(e) => setAmount(e.target.value.replace(/,/g, "").replace(/[^0-9]/g, ""))}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">원</InputAdornment> } }}
          />
          <Box display="flex" gap={0.75} flexWrap="wrap">
            {QUICK_AMOUNTS.map((v) => (
              <Chip
                key={v}
                label={`+${(v / 10000).toLocaleString()}만`}
                size="small"
                onClick={() => handleAddAmount(v)}
                sx={{ cursor: "pointer", fontSize: "0.75rem" }}
              />
            ))}
          </Box>

          {/* 설명 */}
          <TextField
            fullWidth
            size="small"
            label="설명 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* 매월 N일 슬라이더 */}
          <Box>
            <Typography variant="body2" fontWeight={600} mb={1}>
              매월 실행일
              <Typography component="span" color="primary" fontWeight={700} ml={1}>
                {dayOfMonth}일
              </Typography>
            </Typography>
            <Slider
              value={dayOfMonth}
              onChange={(_, v) => setDayOfMonth(v as number)}
              min={1}
              max={31}
              step={1}
              marks={[1, 5, 10, 15, 20, 25, 31].map((v) => ({ value: v, label: `${v}` }))}
              valueLabelDisplay="auto"
            />
            {dayOfMonth > 28 && (
              <Typography variant="caption" color="text.secondary">
                ※ 해당 달에 {dayOfMonth}일이 없으면 말일에 자동 실행됩니다.
              </Typography>
            )}
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={saving}
            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
