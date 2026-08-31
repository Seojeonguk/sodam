import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";

interface HighlightedCategoriesSectionProps {
  categories: CategoryListItemResponse[];
}

export const HighlightedCategoriesSection = ({
  categories,
}: HighlightedCategoriesSectionProps) => {
  const theme = useTheme();
  const hasCategories = categories.length > 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="h6" fontWeight={600} mb={1}>
        주목할 카테고리
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        최근에 가장 많이 사용된 순으로 정렬된 상위 카테고리입니다.
      </Typography>
      {!hasCategories ? (
        <Typography sx={{ width: "100%", height: 320, display: "flex", alignItems: "center", justifyContent: "center" }} color="text.secondary">
          카테고리 데이터가 없습니다.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {categories.map((category) => (
            <Stack
              key={category.id}
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{
                border: "1px solid",
                borderColor: alpha(
                  category.color ?? theme.palette.divider,
                  0.5,
                ),
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  backgroundColor:
                    category.color ?? alpha(theme.palette.primary.main, 0.15),
                }}
              />
              <Box flex={1}>
                <Typography fontWeight={600}>{category.name}</Typography>
                {category.description && (
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                )}
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
};
