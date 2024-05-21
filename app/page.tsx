"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { Card, Heading, Flex, Label, Input, SelectField, TextAreaField, Loader } from "@aws-amplify/ui-react";



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
  const [loading, setLoading] = useState<boolean>(false)
  const [role, setRole] = useState<string>("")
  const [level, setLevel] = useState<string>("")
  const [plan, setPlan] = useState<string>("")

  const handleInputChange = (questionId: number, value: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };
 
  const handleRoleChange  = (role: string) => {
    setRole(role)
  }

  const listLearningPlans = () => {
    client.models.LearningPlan.observeQuery().subscribe({
      next: (data) => setLearningPlans([...data.items]),
    });
  }

  useEffect(() => {
    listLearningPlans();
  }, []);

  const createLearningPlan = async () => {
    //let plan = event.target.value
   setLoading(true) 
     const createdPlan =  await client.models.LearningPlan.create({
      role: role,
      level: level,
      plan: plan,
      status: 'initial',
    });

    setLoading(false) 
    return createdPlan
  }

  const fetchQuestions = async (level: string) => {
    setLoading(true)
    setLevel(level)
  

    //connect with llm and generate questions for role and level
    const response = await client.queries.askBedrock(
      { prompt: `To enable us generate a more relevant learning plan for a ${level} ${role} give me questions we can ask the user. Answers to this question will be fed back to an llm to generate a learning plan. Return 10 questions in the following format:
      {"questions": [
        {
          "id": 1,
          "text": "What is your current level of expertise?"
        },
        {
          "id": 2,
          "text": "How comfortable are you with presenting to an audience?"
        }]}` });

      const res = JSON.parse(response.data?.body!);
     
      const content = JSON.parse(res.content[0].text);
      const generatedQuestions = content["questions"] ?? [];
      setQuestions(generatedQuestions);
      setLoading(false)
  }

  const generatePlan = async (event: any) => {
   setLoading(true);
    let answersString = `Given the following questions and answers, generate a learning plan for a ${level} ${role}:`;
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
      setPlan(content)
      setLoading(false);
  }

  const handleModifiedPlan = (event: any) => {
      setPlan(event.target.value)
  }

  return (
       
  <Authenticator>
    {({ signOut, user }) => ( 
    <main>
      <div>
     <Card>
      <Heading level={3}>Generate Learning Plans</Heading>
      <Heading level={5}>Please fill out the following form to generate a learning plan.</Heading>
      <Flex direction="column" gap="small">
       {/* @TODO pass form fields to prompt to fetch questions */}
        <SelectField
        label="Role"
        options={['','Cloud Architect','Software Engineer', 'Product Designer']}
        placeholder="Select a role"
        onChange={(event)=>handleRoleChange(event.target.value)}
        ></SelectField>
        
        <SelectField
        label="Level"
        options={['', 'Junior','Mid', 'Senior']}
        placeholder="Select a level"
        onChange={(event) => fetchQuestions(event.target.value)}
        ></SelectField>
       
      <Loader display={loading?"block":"none"} variation="linear"  />
      {questions.map((question) => (
        <div key={question.id} >
          <Label>{question.text}</Label>
          <Input onBlur={(event) => handleInputChange(question.id, event.target.value)}/>
        </div>
      ))}
</Flex>
<Flex direction="column" margin="large">
      <button onClick={generatePlan}>Generate Plan</button>
      </Flex>
<Loader display={loading?"block":"none"} variation="linear"  />

<div hidden={!generatedPlan}>
  <Heading level={5}>Generated Plan</Heading>
  <Flex direction="column"  gap="medium">
    <TextAreaField label="" defaultValue={generatedPlan} rows={30} onChange={(event)=> handleModifiedPlan(event.target.value)}></TextAreaField>
  <button onClick={createLearningPlan}>Save Plan</button>
</Flex>  
</div>   
     </Card>
 <Card>  
      <h1>My Learning Plans</h1>
      <ul>
        {learningPlans.map((learningPlan) => (
          <li key={learningPlan.id}>{learningPlan.role} - {learningPlan.level}</li>
        ))}
      </ul>
  </Card>  
      </div>
      <button onClick={signOut}>Sign out</button>
    </main>
    )}
  </Authenticator>
  );
}
