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
  IconButton,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CategoryIcon from "@mui/icons-material/Category";
import type { CategoryListItemResponse } from "../../transaction/services/category.types";

interface CategoryListProps {
  categories: CategoryListItemResponse[];
  onDelete: (id: number) => void;
  onEdit?: (category: CategoryListItemResponse) => void;
}

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
    <List>
      {categories.map((category, index) => (
        <React.Fragment key={category.id}>
          <ListItem
            secondaryAction={
              <Box>
                {onEdit && (
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => onEdit(category)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                )}
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => onDelete(category.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: category.color ?? "primary.main",
                }}
              >
                <CategoryIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1" fontWeight="bold">
                    {category.name}
                  </Typography>
                  {category.color && (
                    <Chip
                      size="small"
                      sx={{
                        bgcolor: category.color,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </Box>
              }
              secondary={
                category.description && (
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                )
              }
            />
          </ListItem>
          {index < categories.length - 1 && (
            <Divider component="li" variant="inset" />
          )}
        </React.Fragment>
      ))}
    </List>
  );
};

export default CategoryList;
