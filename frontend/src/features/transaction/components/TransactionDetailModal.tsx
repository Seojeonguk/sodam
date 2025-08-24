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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { TransactionResponseDto } from "../services/transaction.types";
import { useEffect, useState } from "react";
import axios from "axios";
import transactionApi from "../services/transactionApi";
import dayjs from "dayjs";

interface TransactionDetailModalProps {
  isOpen: boolean;
  transactionSeq: number | null;
  onEditRequest: (transaction: TransactionResponseDto) => void;
  onClose: () => void;
  onDeleteRequest: (seq: number) => void;
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
  onEditRequest,
  onClose,
  onDeleteRequest,
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

  const handleEdit = () => {
    if (transaction) {
      onEditRequest(transaction); // 수정 요청 시 거래 데이터를 함께 전달
    }
  };

  const handleDelete = () => {
    if (transaction && window.confirm("정말로 이 거래를 삭제하시겠습니까?")) {
      onDeleteRequest(transaction.seq);
      onClose(); // 삭제 요청 후 모달 닫기
    }
  };

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
          <Button
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.primary.contrastText,
            }}
            variant="text"
            color="primary"
            startIcon={<GridCloseIcon />}
          >
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
              <Typography component="span" fontWeight="bold">
                종류:
              </Typography>{" "}
              <Typography
                component="span"
                sx={{
                  color: transaction.type === "INCOME" ? "green" : "red",
                  fontWeight: "bold",
                }}
              >
                {transaction.type === "INCOME" ? "수입" : "지출"}
              </Typography>
            </Typography>

            <Typography variant="h6" sx={{ mb: 1 }}>
              <Typography component="span" fontWeight="bold">
                금액:
              </Typography>{" "}
              {transaction.amount.toLocaleString("ko-KR")}원
            </Typography>

            <Typography variant="body1" sx={{ mb: 1 }}>
              <Typography component="span" fontWeight="bold">
                카테고리:
              </Typography>{" "}
              {transaction.categorySeq}
            </Typography>

            <Typography variant="body1" sx={{ mb: 1 }}>
              <Typography component="span" fontWeight="bold">
                날짜:
              </Typography>{" "}
              {dayjs(transaction.transactionDate).format(
                "YYYY년 MM월 DD일 HH시 mm분",
              )}
            </Typography>

            {transaction.description && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                <Typography component="span" fontWeight="bold">
                  내용:
                </Typography>{" "}
                {transaction.description}
              </Typography>
            )}
          </Paper>
        )}

        <Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            disabled={loading || !transaction}
          >
            수정
          </Button>

          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={loading || !transaction}
          >
            삭제
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default TransactionDetailModal;
