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
      {transactions.transactions.map((transaction) => (
        <React.Fragment key={transaction.seq}>
          <ListItem 
            onClick={() => onViewDetail(transaction.seq)}
            sx={{
              mb: 2,
              bgcolor: "white",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
              transition: "all 0.2s ease",
              border: "1px solid #F1F5F9",
              cursor: "pointer",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                borderColor: "#E2E8F0"
              }
            }}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor:
                    transaction.type === "INCOME"
                      ? "#E6F4EA" // Pastel green
                      : "#FCE8E6", // Pastel red
                  color:
                    transaction.type === "INCOME"
                      ? "#1E8E3E"
                      : "#D93025",
                  width: 48,
                  height: 48,
                  mr: 2
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
                  fontWeight="800"
                  sx={{
                    fontSize: { xs: "0.95rem", sm: "1.05rem" },
                    color:
                      transaction.type === "INCOME"
                        ? "#1E8E3E"
                        : "#D93025",
                    mb: 0.5,
                    wordBreak: "break-word",
                  }}
                >
                  {transaction.type === "INCOME" ? "+" : "-"}{transaction.amount.toLocaleString("ko-KR")}원
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
                    {transaction.categoryName} -{" "}
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
        </React.Fragment>
      ))}
    </List>
  );
};

export default TransactionList;
