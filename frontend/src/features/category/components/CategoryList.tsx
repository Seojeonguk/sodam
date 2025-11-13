import React from "react";
import {
  List,
  ListItem,
  Divider,
  Typography,
  Box,
  IconButton,
  Chip,
  alpha,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import type { CategoryListItemResponse } from "../../transaction/services/category.types";

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
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <List disablePadding>
        {categories.map((category, index) => (
          <React.Fragment key={category.id}>
            <ListItem
              sx={{
                py: 1.5,
                px: 2,
                "&:hover": {
                  backgroundColor: (theme) =>
                    alpha(theme.palette.action.hover, 0.5),
                },
                transition: "background-color 0.15s ease-in-out",
              }}
              secondaryAction={
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
                          backgroundColor: (theme) =>
                            alpha(theme.palette.primary.main, 0.1),
                        },
                        transition: "all 0.15s ease-in-out",
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
                        backgroundColor: (theme) =>
                          alpha(theme.palette.error.main, 0.1),
                      },
                      transition: "all 0.15s ease-in-out",
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <Box
                display="flex"
                alignItems="center"
                gap={2}
                sx={{ flex: 1, minWidth: 0 }}
              >
                {category.color ? (
                  <Chip
                    label={category.name}
                    size="small"
                    sx={{
                      backgroundColor: category.color,
                      color: getContrastColor(category.color),
                      fontWeight: 500,
                      height: "20px",
                      fontSize: "0.75rem",
                      borderRadius: "12px",
                      "& .MuiChip-label": {
                        padding: "0 8px",
                      },
                    }}
                  />
                ) : (
                  <Chip
                    label={category.name}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 500,
                      height: "20px",
                      fontSize: "0.75rem",
                      borderRadius: "12px",
                      "& .MuiChip-label": {
                        padding: "0 8px",
                      },
                    }}
                  />
                )}
                {category.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {category.description}
                  </Typography>
                )}
              </Box>
            </ListItem>
            {index < categories.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default CategoryList;
