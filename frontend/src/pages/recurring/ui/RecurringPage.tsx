import { useEffect, useState } from "react";
import {
  alpha,
  useTheme,
} from "@mui/material/styles";
import {
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { Add, DeleteOutline, EditOutlined, Repeat } from "@mui/icons-material";
import { useRecurring } from "../../../entities/recurringTransaction/model/useRecurring";
import RecurringSetModal from "../../../features/recurring/ui/RecurringSetModal";
import type { RecurringTransactionResponse } from "../../../entities/recurringTransaction/api/recurring.types";
import categoryApi from "../../../entities/category/api/categoryApi";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";

export default function RecurringPage() {
  const theme = useTheme();
  const { list, loading, error, create, update, toggle, remove, accountBookSeq } = useRecurring();

  const [categories, setCategories] = useState<CategoryListItemResponse[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringTransactionResponse | null>(null);

  useEffect(() => {
    categoryApi.getCategories(0, 100)
      .then((res) => setCategories(res.categories ?? []))
      .catch(() => {});
  }, []);

  const handleOpenCreate = () => { setEditTarget(null); setModalOpen(true); };
  const handleOpenEdit = (item: RecurringTransactionResponse) => { setEditTarget(item); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditTarget(null); };

  const handleSubmit = async (data: Parameters<typeof create>[0]) => {
    if (editTarget) {
      await update(editTarget.id, data);
    } else {
      await create(data);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("반복 거래를 삭제하시겠습니까?")) return;
    await remove(id);
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: { xs: 2, sm: 4 }, mb: 6, px: { xs: 2, sm: 3 } }}>
        <Skeleton variant="text" width={160} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={220} height={20} sx={{ mb: 3 }} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={90} sx={{ mb: 1.5, borderRadius: 2 }} />
        ))}
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 2, sm: 4 }, mb: 6, px: { xs: 2, sm: 3 } }}>

      {/* 헤더 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}>
            반복 거래
          </Typography>
          <Typography variant="caption" color="text.secondary">
            매월 자동으로 생성되는 정기 거래
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreate}
          size="small"
          sx={{ fontWeight: 700, textTransform: "none", whiteSpace: "nowrap" }}
        >
          추가
        </Button>
      </Stack>

      {error && (
        <Typography color="error" variant="body2" mb={2}>{error}</Typography>
      )}

      {/* 빈 상태 */}
      {list.length === 0 && !loading && (
        <Paper
          elevation={0}
          sx={{
            p: 5, textAlign: "center", borderRadius: 3,
            border: "2px dashed", borderColor: "divider",
          }}
        >
          <Repeat sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="body1" fontWeight={600} color="text.secondary" gutterBottom>
            등록된 반복 거래가 없습니다
          </Typography>
          <Typography variant="body2" color="text.disabled" mb={2.5}>
            월세, 구독료 등 정기 거래를 등록하면
            <br />매월 자동으로 거래가 추가됩니다.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleOpenCreate}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            첫 반복 거래 추가
          </Button>
        </Paper>
      )}

      {/* 목록 */}
      <Stack spacing={1.5}>
        {list.map((item) => {
          const isExpense = item.type === "EXPENSE";
          const color = isExpense ? theme.palette.error : theme.palette.success;
          return (
            <Paper
              key={item.id}
              elevation={0}
              sx={{
                p: { xs: 1.75, sm: 2 },
                borderRadius: 2,
                border: "1px solid",
                borderColor: item.isActive ? alpha(color.main, 0.25) : "divider",
                opacity: item.isActive ? 1 : 0.55,
                transition: "all 0.2s ease",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                {/* 날짜 뱃지 */}
                <Box
                  sx={{
                    minWidth: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: item.isActive ? alpha(color.main, 0.12) : "action.hover",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color={item.isActive ? (isExpense ? "error.main" : "success.main") : "text.disabled"}
                    sx={{ fontSize: "0.7rem", lineHeight: 1 }}
                  >
                    매월
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    color={item.isActive ? (isExpense ? "error.main" : "success.main") : "text.disabled"}
                    sx={{ fontSize: "1rem", lineHeight: 1.2 }}
                  >
                    {item.dayOfMonth}
                  </Typography>
                </Box>

                {/* 정보 */}
                <Box flex={1} minWidth={0}>
                  <Stack direction="row" alignItems="center" spacing={0.75} mb={0.25}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {item.description || "설명 없음"}
                    </Typography>
                    {item.categoryName && item.categoryName !== "미분류" && (
                      <Chip label={item.categoryName} size="small" sx={{ fontSize: "0.68rem", height: 18 }} />
                    )}
                  </Stack>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    color={isExpense ? "error.main" : "success.main"}
                  >
                    {isExpense ? "- " : "+ "}
                    {Number(item.amount).toLocaleString("ko-KR")}원
                  </Typography>
                </Box>

                {/* 컨트롤 */}
                <Stack direction="row" alignItems="center" spacing={0.5} flexShrink={0}>
                  <Switch
                    size="small"
                    checked={item.isActive}
                    onChange={() => void toggle(item.id)}
                    color={isExpense ? "error" : "success"}
                  />
                  <IconButton size="small" onClick={() => handleOpenEdit(item)}>
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => void handleDelete(item.id)} color="error">
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      <RecurringSetModal
        open={modalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        categories={categories}
        accountBookSeq={accountBookSeq ?? -1}
        initial={editTarget}
      />
    </Container>
  );
}
