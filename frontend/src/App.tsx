import * as React from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import "./App.css";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import dayjs from "dayjs";

export interface TransactionRow {
  id: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
  transactionDate: string;
  satisfactionRating: number;
}

export const columns: GridColDef<TransactionRow>[] = [
  { field: "id", headerName: "번호", width: 70 },
  {
    field: "type",
    headerName: "거래 유형",
    sortable: false,
    width: 80,
    valueGetter: (value, row) => `${row.type === "INCOME" ? "수입" : "지출"}`,
  },
  { field: "description", headerName: "설명", width: 300 },
  {
    field: "amount",
    headerName: "금액",
    type: "number",
    width: 120,
    valueFormatter: (value, row) =>
      `${(row.amount as number).toLocaleString("ko-KR")}원`,
  },
  {
    field: "transactionDate",
    headerName: "거래일",
    width: 200,
    valueFormatter: (value, row) =>
      dayjs(row.transactionDate as string, "YYYYMMDDHHmmss").format(
        "YYYY.MM.DD HH:mm",
      ),
  },
  {
    field: "satisfactionRating",
    headerName: "만족도",
    type: "number",
    width: 90,
  },
];

export const generateRandomRows = (count: number): TransactionRow[] => {
  const generatedRows: TransactionRow[] = [];
  const descriptions = [
    "식비",
    "교통비",
    "문화생활",
    "급여",
    "부수입",
    "경조사",
    "의류",
    "통신비",
    "저축",
    "카페",
  ];
  const types: ("INCOME" | "EXPENSE")[] = ["INCOME", "EXPENSE"];

  for (let i = 1; i <= count; i++) {
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomDescription =
      descriptions[Math.floor(Math.random() * descriptions.length)];

    const randomAmount =
      randomType === "INCOME"
        ? Math.floor(Math.random() * 500000) + 10000
        : Math.floor(Math.random() * 50000) + 1000;

    const randomDate = dayjs()
      .subtract(Math.floor(Math.random() * 30), "days")
      .subtract(Math.floor(Math.random() * 24), "hours")
      .subtract(Math.floor(Math.random() * 60), "minutes")
      .subtract(Math.floor(Math.random() * 60), "seconds")
      .format("YYYYMMDDHHmmss");

    const randomSatisfactionRating = Math.floor(Math.random() * 5) + 1;

    generatedRows.push({
      id: i,
      type: randomType,
      description: randomDescription,
      amount: randomAmount,
      transactionDate: randomDate,
      satisfactionRating: randomSatisfactionRating,
    });
  }
  return generatedRows;
};

const rows = generateRandomRows(17);

function App() {
  const page = 0;
  const pageSize = 10;

  const paginationModel = { page: page, pageSize: pageSize };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        padding: 0,
      }}
    >
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            💰 소담
          </Typography>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth="md"
        sx={{
          flexGrow: 1,
          mt: 4,
          mb: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 3,
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Paper sx={{ height: "100%", width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{ pagination: { paginationModel } }}
              pageSizeOptions={[5, 10]}
              checkboxSelection
              sx={{ border: 0 }}
            />
          </Paper>
        </Paper>
      </Container>
      <Box
        component="footer"
        sx={{
          p: 2,
          mt: "auto",
          backgroundColor: "#e0e0e0",
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2025 소담
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
