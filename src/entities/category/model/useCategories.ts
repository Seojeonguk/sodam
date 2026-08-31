import { useCallback, useEffect, useState } from "react";
import categoryApi from "../api/categoryApi";
import type { CategoryListItemResponse } from "../../transaction/api/category.types";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

export const useCategories = (accountBookSeq?: number | null) => {
  const [categories, setCategories] = useState<CategoryListItemResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (accountBookSeq == null) { setCategories([]); return; }

    setLoading(true);
    setError(null);

    try {
      const response = await categoryApi.getCategories(accountBookSeq);
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
  }, [accountBookSeq]);

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
