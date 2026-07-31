import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Modal,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { TransactionResponseDto } from "../../../entities/transaction/api/transaction.types";
import React, { useEffect, useState } from "react";
import axios from "axios";
import transactionApi from "../../../entities/transaction/api/transactionApi";
import dayjs from "dayjs";
import { formatCurrency } from "../../../shared/lib/format";

interface TransactionDetailModalProps {
  isOpen: boolean;
  transactionSeq: number | null;
  onEditRequest: (transaction: TransactionResponseDto) => void;
  onClose: () => void;
  onDeleteRequest: (seq: number) => void;
}

const MODAL_SX = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(500px, calc(100vw - 32px))",
  maxHeight: "calc(100vh - 64px)",
  overflowY: "auto" as const,
  bgcolor: "background.paper",
  border: "none",
  boxShadow: "0 24px 64px rgba(15,23,42,0.18)",
  borderRadius: "24px",
  p: 0,
  outline: "none",
};

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transactionSeq,
  onEditRequest,
  onClose,
  onDeleteRequest,
}) => {
  const [transaction, setTransaction] = useState<TransactionResponseDto | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactionDetail = async () => {
      if (!isOpen || !transactionSeq) {
        setTransaction(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await transactionApi.getTransactionBySeq(transactionSeq);
        setTransaction(data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          const data =
            err.response.data && typeof err.response.data === "object"
              ? (err.response.data as { message?: string })
              : undefined;
          setError(
            `거래 상세 조회 실패: ${data?.message ?? (typeof err.message === "string" ? err.message : "오류가 발생했습니다.")}`
          );
        } else {
          setError("거래 상세 조회 중 예상치 못한 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchTransactionDetail();
  }, [isOpen, transactionSeq]);

  const handleEdit = () => {
    if (transaction) {
      onEditRequest(transaction);
    }
  };

  const handleDelete = () => {
    if (transaction) {
      onDeleteRequest(transaction.seq);
      onClose();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="transaction-detail-modal-title"
      aria-describedby="transaction-detail-modal-description"
    >
      <Box sx={MODAL_SX}>
        {/* 헤더 */}
        <Box
          sx={{
            p: 3,
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: "24px 24px 0 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            id="transaction-detail-modal-title"
            variant="h6"
            fontWeight={700}
            sx={{ color: "common.white" }}
          >
            거래 상세
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "common.white",
              bgcolor: (theme) => alpha(theme.palette.common.white, 0.15),
              "&:hover": {
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.25),
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 콘텐츠 */}
        <Box sx={{ p: 3 }}>
          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {transaction && !loading && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                  분류
                </Typography>
                <Chip
                  label={transaction.type === "INCOME" ? "수입" : "지출"}
                  color={transaction.type === "INCOME" ? "success" : "error"}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Divider />

              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                  금액
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatCurrency(transaction.amount)}
                </Typography>
              </Stack>

              <Divider />

              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                  카테고리
                </Typography>
                <Typography variant="body1">
                  카테고리 ID: {transaction.categorySeq ?? "없음"}
                </Typography>
              </Stack>

              <Divider />

              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                  날짜
                </Typography>
                <Typography variant="body1">
                  {dayjs(transaction.transactionDate).format("YYYY년 MM월 DD일 HH시 mm분")}
                </Typography>
              </Stack>

              {transaction.description && (
                <>
                  <Divider />
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60, pt: 0.25 }}>
                      설명
                    </Typography>
                    <Typography variant="body1">{transaction.description}</Typography>
                  </Stack>
                </>
              )}
            </Stack>
          )}

          {/* 버튼 영역 */}
          <Box display="flex" gap={2} mt={3}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              disabled={loading || !transaction}
              fullWidth
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
            >
              삭제
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default TransactionDetailModal;
