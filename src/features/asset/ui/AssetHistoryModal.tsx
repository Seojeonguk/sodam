import React from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import { LineChart } from "@mui/x-charts";
import dayjs from "dayjs";
import { ASSET_TYPE_CONFIG, type AssetResponse } from "../../../entities/asset/api/asset.types";
import { useAssetHistory } from "../../../entities/asset/model/useAssets";

interface Props {
  open: boolean;
  asset: AssetResponse | null;
  onClose: () => void;
}

const AssetHistoryModal: React.FC<Props> = ({ open, asset, onClose }) => {
  const { history, loading } = useAssetHistory(open && asset ? asset.seq : null);

  if (!asset) return null;
  const cfg = ASSET_TYPE_CONFIG[asset.type];

  // LineChart 데이터 준비
  const chartData = history.map((h) => ({
    date: dayjs(h.recordedAt, "YYYYMMDDHHmmss").valueOf(),
    balance: h.balance,
  }));

  const hasChart = chartData.length >= 2;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ "& .MuiDialog-container": { alignItems: { xs: "flex-end", sm: "center" } } }}
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          width: { xs: "100%", sm: undefined },
          maxWidth: { xs: "100%", sm: 600 },
          borderRadius: { xs: "20px 20px 0 0", sm: 3 },
          maxHeight: { xs: "92vh", sm: "85vh" },
        },
      }}
    >
      {/* 모바일 드래그 핸들 */}
      <Box sx={{ display: { xs: "flex", sm: "none" }, justifyContent: "center", pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "action.disabled" }} />
      </Box>
      <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" fontWeight={800}>{asset.name}</Typography>
          <Typography variant="caption" color="text.secondary">잔액 변화 내역</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="닫기"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {/* 현재 잔액 배너 */}
        <Box sx={{
          mb: 2.5, p: 2, borderRadius: 2,
          bgcolor: alpha(cfg.color, 0.08),
          border: `1px solid ${alpha(cfg.color, 0.2)}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>현재 잔액</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ color: cfg.color }}>
            {asset.balance.toLocaleString("ko-KR")}원
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>
        ) : history.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            아직 잔액 기록이 없습니다.
          </Typography>
        ) : (
          <>
            {/* 라인 차트 */}
            {hasChart ? (
              <Box sx={{ mb: 2 }}>
                <LineChart
                  xAxis={[{
                    data: chartData.map((d) => d.date),
                    valueFormatter: (v) => dayjs(v).format("MM/DD"),
                    scaleType: "time",
                  }]}
                  series={[{
                    data: chartData.map((d) => d.balance),
                    label: "잔액",
                    color: cfg.color,
                    area: true,
                    showMark: chartData.length <= 10,
                  }]}
                  height={200}
                  margin={{ left: 60, right: 16, top: 12, bottom: 28 }}
                  grid={{ horizontal: true }}
                />
              </Box>
            ) : (
              <Box sx={{
                mb: 2, p: 2, borderRadius: 2,
                bgcolor: "action.hover", textAlign: "center",
              }}>
                <Typography variant="body2" color="text.secondary">
                  기록이 2건 이상이면 추이 차트가 표시됩니다.
                </Typography>
              </Box>
            )}

            <Divider sx={{ mb: 1.5 }} />

            {/* 히스토리 리스트 (최신 순) */}
            <List dense disablePadding>
              {[...history].reverse().map((h) => {
                const positive = h.delta >= 0;
                return (
                  <ListItem
                    key={h.seq}
                    disableGutters
                    sx={{ py: 0.8 }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" fontWeight={700}>
                              {h.balance.toLocaleString("ko-KR")}원
                            </Typography>
                            <Chip
                              size="small"
                              label={h.source === "MANUAL" ? "수동" : "거래"}
                              sx={{ fontSize: "0.65rem", height: 18 }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={h.delta === 0 ? "text.secondary" : positive ? "success.main" : "error.main"}
                          >
                            {h.delta === 0 ? "—" : `${positive ? "+" : ""}${h.delta.toLocaleString("ko-KR")}원`}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" color="text.secondary">
                            {h.note ?? ""}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(h.recordedAt, "YYYYMMDDHHmmss").format("YYYY.MM.DD HH:mm")}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssetHistoryModal;
