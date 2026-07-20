import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import dayjs from "dayjs";

import type { TransactionListResponse } from "../api/transaction.types";

interface TransactionListProps {
  transactions: TransactionListResponse | null;
  onViewDetail: (seq: number) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onViewDetail,
}) => {
  const theme = useTheme();

  if (!transactions || transactions.transactions.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          아직 거래 내역이 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {transactions.transactions.map((transaction) => {
        const isIncome = transaction.type === "INCOME";
        return (
          <React.Fragment key={transaction.seq}>
            <ListItem
              onClick={() => onViewDetail(transaction.seq)}
              sx={{
                mb: 1.5,
                bgcolor: "background.paper",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.06)}`,
                  borderColor: isIncome
                    ? alpha(theme.palette.success.main, 0.4)
                    : alpha(theme.palette.error.main, 0.4),
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: isIncome
                      ? alpha(theme.palette.success.main, 0.12)
                      : alpha(theme.palette.error.main, 0.12),
                    color: isIncome
                      ? theme.palette.success.dark
                      : theme.palette.error.dark,
                    width: { xs: 38, sm: 48 },
                    height: { xs: 38, sm: 48 },
                    mr: 1,
                  }}
                >
                  {isIncome ? <AttachMoneyIcon /> : <MoneyOffIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography
                    variant="body1"
                    fontWeight={800}
                    sx={{
                      fontSize: { xs: "0.95rem", sm: "1.05rem" },
                      color: isIncome
                        ? theme.palette.success.dark
                        : theme.palette.error.dark,
                      mb: 0.5,
                      wordBreak: "break-word",
                    }}
                  >
                    {isIncome ? "+" : "-"}{transaction.amount.toLocaleString("ko-KR")}원
                  </Typography>
                }
                secondary={
                  <React.Fragment>
                    <Typography
                      sx={{ display: "inline" }}
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {transaction.categoryName} —{" "}
                    </Typography>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {dayjs(transaction.transactionDate).format("YYYY.MM.DD HH:mm")}
                    </Typography>
                    {transaction.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        {transaction.description}
                      </Typography>
                    )}
                  </React.Fragment>
                }
              />
            </ListItem>
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default TransactionList;
