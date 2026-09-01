import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { TransactionResponseDto } from "../../../entities/transaction/api/transaction.types";
import React, { useEffect, useState } from "react";
import transactionApi from "../../../entities/transaction/api/transactionApi";
import dayjs from "dayjs";
import { formatCurrency } from "../../../shared/lib/format";
import { getServerErrorMessage } from "../../../shared/lib/serverState";
import { TYPE_LABEL, TYPE_MUI_COLOR } from "../../../entities/category/lib/classificationUtils";

interface TransactionDetailModalProps {
  isOpen: boolean;
  transactionSeq: number | null;
  onEditRequest: (transaction: TransactionResponseDto) => void;
  onClose: () => void;
  onDeleteRequest: (seq: number) => void;
}

const RATING_LABEL = ["", "후회됨", "아쉬움", "보통", "만족", "매우 만족"];

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transactionSeq,
  onEditRequest,
  onClose,
  onDeleteRequest,
}) => {
  const [transaction, setTransaction] = useState<TransactionResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactionDetail = async () => {
      if (!isOpen || !transactionSeq) { setTransaction(null); return; }
      setLoading(true);
      setError(null);
      try {
        const data = await transactionApi.getTransactionBySeq(transactionSeq);
        setTransaction(data);
      } catch (err) {
        setError(getServerErrorMessage(err, "거래 상세 조회 중 예상치 못한 오류가 발생했습니다."));
      } finally {
        setLoading(false);
      }
    };
    void fetchTransactionDetail();
  }, [isOpen, transactionSeq]);

  const handleEdit = () => { if (transaction) onEditRequest(transaction); };
  const handleDelete = () => { if (transaction) { onDeleteRequest(transaction.seq); onClose(); } };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{ "& .MuiDialog-container": { alignItems: { xs: "flex-end", sm: "center" } } }}
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          width: { xs: "100%", sm: undefined },
          maxWidth: { xs: "100%", sm: 500 },
          borderRadius: { xs: "20px 20px 0 0", sm: 3 },
          maxHeight: { xs: "92vh", sm: "88vh" },
          overflowY: "auto",
        },
      }}
    >
      {/* 모바일 드래그 핸들 */}
      <Box sx={{ display: { xs: "flex", sm: "none" }, justifyContent: "center", pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "action.disabled" }} />
      </Box>

      <DialogTitle sx={{ fontWeight: 700, pb: 0, pr: 6 }}>
        거래 상세
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {transaction && !loading && (
          <Stack spacing={2}>
            {/* 분류 */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 64 }}>분류</Typography>
              <Chip
                label={TYPE_LABEL[transaction.type] ?? transaction.type}
                color={TYPE_MUI_COLOR[transaction.type] ?? "default"}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            <Divider />

            {/* 금액 */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 64 }}>금액</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(transaction.amount)}</Typography>
            </Stack>

            <Divider />

            {/* 카테고리 */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 64 }}>카테고리</Typography>
              <Typography variant="body1">{transaction.categoryName ?? "미분류"}</Typography>
            </Stack>

            <Divider />

            {/* 날짜 */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 64 }}>날짜</Typography>
              <Typography variant="body1">
                {dayjs(transaction.transactionDate).format("YYYY년 MM월 DD일 HH시 mm분")}
              </Typography>
            </Stack>

            {/* 설명 */}
            {transaction.description && (
              <>
                <Divider />
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 64, pt: 0.25 }}>설명</Typography>
                  <Typography variant="body1">{transaction.description}</Typography>
                </Stack>
              </>
            )}

            {/* 소비 만족도 */}
            {transaction.satisfactionRating > 0 && (
              <>
                <Divider />
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 64 }}>만족도</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Rating value={transaction.satisfactionRating} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary">
                      {RATING_LABEL[transaction.satisfactionRating]}
                    </Typography>
                  </Stack>
                </Stack>
              </>
            )}
          </Stack>
        )}

        {/* 액션 버튼 */}
        <Box display="flex" gap={1.5} mt={3}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            disabled={loading || !transaction}
            fullWidth
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            수정
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={loading || !transaction}
            fullWidth
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            삭제
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailModal;
