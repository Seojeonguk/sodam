import api from "../../../shared/api/api";
import type { ClassificationResponse } from "./classification.types";

const CLASSIFICATION_BASE_URL = "/classifications";

const classificationApi = {
  getClassifications: async (
    accountBookSeq: number,
  ): Promise<ClassificationResponse[]> => {
    const response = (await api.get<ClassificationResponse[]>(
      `${CLASSIFICATION_BASE_URL}?accountBookSeq=${accountBookSeq}`,
    )) as ClassificationResponse[];

    return response;
  },
};

export default classificationApi;
