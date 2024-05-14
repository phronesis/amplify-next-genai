"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Card, Heading, Flex, Label, Input, SelectField, TextAreaField } from "@aws-amplify/ui-react";
import { a } from "@aws-amplify/backend";

Amplify.configure(outputs);

const client = generateClient<Schema>();



export default function App() {

  type Question = {
    id: number;
    text: string;
  };

  type Answers = {
    [key: number]: string;
  };
  const [learningPlans, setLearningPlans] = useState<Array<Schema["LearningPlan"]["type"]>>([]);
  const [questions, setQuestions] = useState<Array<Question>>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [generatedPlan, setGeneratedPlan] = useState<string>("")

  const handleInputChange = (questionId: number, value: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));

  };
  function listLearningPlans() {
    client.models.LearningPlan.observeQuery().subscribe({
      next: (data) => setLearningPlans([...data.items]),
    });
  }

  useEffect(() => {
    listLearningPlans();
  }, []);

  function createLearningPlan(event:any) {
    //let plan = event.target.value
    client.models.LearningPlan.create({
      role: 'software',
      level: 'junior',
      plan: generatedPlan,
      status: 'initial',
    });

    console.log(event.target);
  }

  async function fetchQuestions(e: any) {
    console.log(e.target.value);

    //connect with llm and generate questions for role and level
    const response = await client.queries.askBedrock(
      { prompt: `To enable us generate a more relevant learning plan for a senior level software engineer, give me questions we can ask the user. Answers to this question will be fed back to an llm to generate a learning plan. Return 10 questions in the following format:
      {"questions": [
        {
          "id": 1,
          "text": "What is your current level of expertise in software engineering?"
        },
        {
          "id": 2,
          "text": "How comfortable are you with presenting to an audience?"
        }]}` });

      const res = JSON.parse(response.data?.body!);
     
      const content = JSON.parse(res.content[0].text);
      const generatedQuestions = content["questions"] ?? [];
      setQuestions(generatedQuestions);
  }

  async function submitForm(event: any){
   
    let answersString = "Given the following questions and answers, generate a learning plan for a senior software engineer:";
    for (const [questionId, answer] of Object.entries(answers)) {
      let question = questions.find((q) => q.id === parseInt(questionId));
      if (!question) continue;
      answersString += `\nQuestion: ${question.text}; answer: ${answer}`;
    }

    const response = await client.queries.askBedrock(
      { prompt: answersString });
      const res = JSON.parse(response.data?.body!);
      const content = res.content[0].text; 
      setGeneratedPlan(content)
  }

  return (
    <main>
      <div>
     <Card>
      <Heading level={4}></Heading>
      <Flex direction="column" gap="small">
       
        <SelectField
        label="Role"
        options={['Cloud Architect','Software Engineer', 'Product Designer']}
        ></SelectField>
        
        <SelectField
        label="Level"
        options={['Junior','Mid', 'Senior']}
        onChange={fetchQuestions}
        ></SelectField>
       

      {questions.map((question) => (
        <div key={question.id} >
          <Label>{question.text}</Label>
          <Input onBlur={(event) => handleInputChange(question.id, event.target.value)}/>
        </div>
      ))}
</Flex>
<Flex direction="column">
      <button onClick={submitForm}>Submit</button>
      </Flex>

<Flex direction="column" hidden={!generatedPlan} gap="medium">
  <TextAreaField label="Learning Plan" defaultValue={generatedPlan} row="10"></TextAreaField>
<button onClick={createLearningPlan}>Save Plan</button>
</Flex>     
     </Card>

      </div>
      <h1>My LearningPlans</h1>

      <ul>
        {learningPlans.map((learningPlan) => (
          <li key={learningPlan.id}>{learningPlan.role}</li>
        ))}
      </ul>

    </main>
  );
}
