import api from "../../../shared/api/api";
import { guestMode } from "../../../shared/lib/guestMode";
import type { ClassificationResponse } from "./classification.types";

const CLASSIFICATION_BASE_URL = "/classifications";

const GUEST_CLASSIFICATIONS: ClassificationResponse[] = [
  { id: 1, name: "INCOME" },
  { id: 2, name: "EXPENSE" },
];

const classificationApi = {
  getClassifications: async (
    accountBookSeq: number,
  ): Promise<ClassificationResponse[]> => {
    if (guestMode.isActive()) return GUEST_CLASSIFICATIONS;
    return api.get<ClassificationResponse[]>(
      `${CLASSIFICATION_BASE_URL}?accountBookSeq=${accountBookSeq}`,
    );
  },
};

export default classificationApi;
