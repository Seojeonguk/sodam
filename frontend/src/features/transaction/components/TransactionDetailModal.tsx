import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Modal,
  Paper,
  Typography,
} from "@mui/material";
import { GridCloseIcon } from "@mui/x-data-grid";
import type { TransactionResponseDto } from "../services/transaction.types";
import { useEffect, useState } from "react";
import axios from "axios";
import transactionApi from "../services/transactionApi";
import dayjs from "dayjs";

interface TransactionDetailModalProps {
  isOpen: boolean;
  transactionSeq: number | null;
  onClose: () => void;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 450, // Create Modal보다 약간 넓게 설정
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
};

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transactionSeq,
  onClose,
}) => {
  const [transaction, setTransaction] = useState<TransactionResponseDto | null>(
    null,
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
          setError(
            `거래 상세 조회 실패: ${err.response.data?.message || err.message}`,
          );
        } else {
          setError("거래 상세 조회 중 예상치 못한 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetail();
  }, [isOpen, transactionSeq]); // 모달이 열리거나 transactionId가 변경될 때마다 데이터를 가져옴

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="transaction-detail-modal-title"
      aria-describedby="transaction-detail-modal-description"
    >
      <Box sx={style}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography
            id="transaction-detail-modal-title"
            variant="h5"
            component="h2"
          >
            거래 상세 내역
          </Typography>
          <Button onClick={onClose} startIcon={<GridCloseIcon />}>
            닫기
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

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
          <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>종류:</strong>{" "}
              <span
                style={{
                  color: transaction.type === "INCOME" ? "green" : "red",
                }}
              >
                {transaction.type === "INCOME" ? "수입" : "지출"}
              </span>
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              <strong>금액:</strong>{" "}
              {transaction.amount.toLocaleString("ko-KR")}원
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>카테고리:</strong> {transaction.categorySeq}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>날짜:</strong>{" "}
              {dayjs(transaction.transactionDate).format(
                "YYYY년 MM월 DD일 HH시 mm분",
              )}
            </Typography>
            {transaction.description && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>내용:</strong> {transaction.description}
              </Typography>
            )}
          </Paper>
        )}
      </Box>
    </Modal>
  );
};

export default TransactionDetailModal;
