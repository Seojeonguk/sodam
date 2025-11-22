import React from "react";
import {
  Typography,
  Box,
  IconButton,
  Chip,
  Paper,
  Stack,
  alpha,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import type { CategoryListItemResponse } from "../../transaction/services/category.types";
import { useTheme } from "@mui/material/styles";

interface CategoryListProps {
  categories: CategoryListItemResponse[];
  onDelete: (id: number) => void;
  onEdit?: (category: CategoryListItemResponse) => void;
}

// 색상 밝기 계산 함수 (0-255 범위)
const getLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 128;
  // 상대적 밝기 계산 (0.299*R + 0.587*G + 0.114*B)
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
};

// Hex 색상을 RGB로 변환
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  // # 제거
  const cleanHex = hex.replace("#", "");

  // 3자리 hex를 6자리로 변환
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((char) => char + char)
          .join("")
      : cleanHex;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// 배경색에 맞는 텍스트 색상 결정
const getContrastColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);
  // 밝기가 128보다 크면 어두운 텍스트, 작으면 밝은 텍스트
  return luminance > 128 ? "#000000" : "#ffffff";
};

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onDelete,
  onEdit,
}) => {
  const theme = useTheme();

  if (categories.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          아직 카테고리가 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(auto-fit, minmax(240px, 1fr))",
          md: "repeat(auto-fit, minmax(260px, 1fr))",
        },
        gap: 2.5,
      }}
    >
      {categories.map((category) => {
        const accent = category.color ?? theme.palette.divider;
        return (
          <Paper
            key={category.id}
            elevation={0}
            sx={{
              position: "relative",
              p: 3,
              borderRadius: 3,
              border: `1px solid ${alpha(accent, 0.4)}`,
              backgroundColor: alpha(accent, category.color ? 0.08 : 0.04),
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 15px 30px rgba(15,23,42,0.12)",
              },
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label={category.name}
                  size="small"
                  sx={{
                    backgroundColor: category.color
                      ? category.color
                      : alpha(theme.palette.text.primary, 0.08),
                    color: category.color
                      ? getContrastColor(category.color)
                      : theme.palette.text.primary,
                    fontWeight: 600,
                    "& .MuiChip-label": { px: 1.5 },
                  }}
                />
                {category.color && (
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.6)",
                      backgroundColor: category.color,
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
                    }}
                  />
                )}
              </Stack>

              {category.description ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    minHeight: "2.5rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {category.description}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.disabled">
                  설명이 아직 없습니다.
                </Typography>
              )}

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="caption" color="text.secondary">
                  ID #{category.id}
                </Typography>
                <Box display="flex" gap={0.5}>
                  {onEdit && (
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => onEdit(category)}
                      size="small"
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          color: "primary.main",
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.12,
                          ),
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => onDelete(category.id)}
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": {
                        color: "error.main",
                        backgroundColor: alpha(theme.palette.error.main, 0.12),
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Stack>
            </Stack>

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: 3,
                pointerEvents: "none",
                border: `1px solid ${alpha(accent, 0.25)}`,
              }}
            />
          </Paper>
        );
      })}
    </Box>
  );
};

export default CategoryList;
