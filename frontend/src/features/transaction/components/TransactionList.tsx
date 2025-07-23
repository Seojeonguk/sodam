import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Typography,
  Box,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import dayjs from "dayjs";

import type { TransactionListResponseDto } from "../services/transaction.types";

interface TransactionListProps {
  transactions: TransactionListResponseDto | null;
  onViewDetail: (seq: number) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onViewDetail,
}) => {
  if (!transactions || transactions.content.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          아직 거래 내역이 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {transactions.content.map((transaction, index) => (
        <React.Fragment key={transaction.seq}>
          <ListItem onClick={() => onViewDetail(transaction.seq)}>
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor:
                    transaction.type === "INCOME"
                      ? "success.main"
                      : "error.main",
                }}
              >
                {transaction.type === "INCOME" ? (
                  <AttachMoneyIcon />
                ) : (
                  <MoneyOffIcon />
                )}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  sx={{
                    color:
                      transaction.type === "INCOME"
                        ? "success.dark"
                        : "error.dark",
                  }}
                >
                  {transaction.amount.toLocaleString("ko-KR")}원
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
                    {transaction.categorySeq} -{" "}
                  </Typography>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                  >
                    {dayjs(transaction.transactionDate).format(
                      "YYYY.MM.DD HH:mm",
                    )}
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
          {index < transactions.content.length - 1 && (
            <Divider component="li" variant="inset" />
          )}
        </React.Fragment>
      ))}
    </List>
  );
};

export default TransactionList;
