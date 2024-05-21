import { defineFunction } from "@aws-amplify/backend";

export const AMAZON_BEDROCK_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

export const generateQuestions = defineFunction({
    name: "generateQuestions",
    environment: {
        AMAZON_BEDROCK_MODEL_ID,
    },
})