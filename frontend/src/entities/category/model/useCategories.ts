import { useCallback, useEffect, useState } from "react";
import categoryApi from "../api/categoryApi";
import type { CategoryListItemResponse } from "../../transaction/api/category.types";
import { useAccountBookContext } from "../../accountbook/model/AccountBookContext";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryListItemResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentAccountBook } = useAccountBookContext();

  const fetchCategories = useCallback(async () => {
    if (!currentAccountBook?.id) {
      setCategories(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await categoryApi.getCategories();
      setCategories(response);
    } catch (nextError) {
      setError(
        getServerErrorMessage(
          nextError,
          "카테고리를 불러오는 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [currentAccountBook?.id]);

  const deleteCategory = useCallback(
    async (id: number, replacementId: number) => {
      try {
        await categoryApi.deleteCategory(id, replacementId);
        await fetchCategories();
      } catch (nextError) {
        throw new Error(
          getServerErrorMessage(
            nextError,
            "카테고리 삭제 중 오류가 발생했습니다.",
          ),
        );
      }
    },
    [fetchCategories],
  );

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetchCategories: fetchCategories,
    deleteCategory,
  };
};
