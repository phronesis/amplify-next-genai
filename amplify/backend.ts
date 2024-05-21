import { defineBackend } from '@aws-amplify/backend';
// import { Stack } from "aws-cdk-lib/core"
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
//import { AMAZON_BEDROCK_MODEL_ID, generateQuestions } from './functions/generateQuestions/resource.js';



const backend = defineBackend({
  auth,
  data,
});

const bedrockDataSource = backend.data.resources.graphqlApi.addHttpDataSource(
  "bedrockDS",
  "https://bedrock-runtime.us-east-1.amazonaws.com",
  {
    authorizationConfig: {
      signingRegion: "us-east-1",
      signingServiceName: "bedrock",
    },
  }
);

bedrockDataSource.grantPrincipal.addToPrincipalPolicy(
  new PolicyStatement({
    resources: [
      "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
    ],
    actions: ["bedrock:InvokeModel"],
    
  })
);

// const generateQuestionFunc = backend.generateQuestions.resources.lambda

// generateQuestionFunc.addToRolePolicy(
//   new PolicyStatement({
//     effect: Effect.ALLOW,
//     actions: ["bedrock:InvokeModel"],
//     resources: [
//       `arn:aws:bedrock:${
//         Stack.of(generateQuestionFunc).region
//       }::foundation-model/${AMAZON_BEDROCK_MODEL_ID}`,
//     ],
//   })
// )
