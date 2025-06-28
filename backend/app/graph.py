# app/graph.py
import asyncio
import json
from typing import Dict, List, Any, TypedDict, Optional
from dataclasses import dataclass

from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

class PhotoState(TypedDict):
    image_data: str
    filename: str
    scores: Dict[str, float]
    rationales: Dict[str, str]
    overall_score: float
    overall_reasoning: str
    stage: str

class AppState(TypedDict):
    photo: PhotoState
    criteria: List["JudgingCriterion"]
    competition_rules: str
    # Add prompt templates to the state
    evaluation_prompt_template: str
    reasoning_prompt_template: str

@dataclass
class JudgingCriterion:
    name: str
    description: str
    weight: float = 1.0

class PhotoJudgeApp:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite-preview-06-17", temperature=0.3)

    def _build_workflow(self) -> StateGraph:
        workflow = StateGraph(AppState)
        workflow.add_node("evaluate_photo", self.evaluate_photo_node)
        workflow.add_node("calculate_final_score", self.calculate_final_score_node)
        workflow.add_node("generate_overall_reasoning", self.generate_overall_reasoning_node)

        workflow.set_entry_point("evaluate_photo")
        workflow.add_edge("evaluate_photo", "calculate_final_score")
        workflow.add_edge("calculate_final_score", "generate_overall_reasoning")
        workflow.add_edge("generate_overall_reasoning", END)
        return workflow.compile()

    async def evaluate_photo_node(self, state: AppState) -> AppState:
        print("🔍 Evaluating photo against criteria...")
        image_data = state["photo"]["image_data"]
        criteria_to_evaluate = state["criteria"]
        prompt_template = state["evaluation_prompt_template"]

        async def evaluate(criterion: JudgingCriterion):
            return criterion.name, await self._evaluate_criterion(image_data, criterion, prompt_template)

        tasks = [evaluate(criterion) for criterion in criteria_to_evaluate]
        results = await asyncio.gather(*tasks)
        state["photo"]["scores"] = {name: score for name, (score, _) in results}
        state["photo"]["rationales"] = {name: rationale for name, (_, rationale) in results}
        state["photo"]["stage"] = "evaluated"
        return state
    
    async def _evaluate_criterion(self, image_data: str, criterion: JudgingCriterion, template: str) -> tuple[float, str]:
        # The prompt is now created dynamically from the template in the DB
        prompt_text = template.format(
            criterion_name=criterion.name,
            criterion_description=criterion.description
        )
        prompt = ChatPromptTemplate.from_messages([
            ("system", prompt_text),
            ("user", [
                {"type": "text", "text": f"Please evaluate this photograph."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
            ])
        ])
        
        try:
            chain = prompt | self.llm
            response = await chain.ainvoke({})
            content = response.content
            
            lines = content.split('\n')
            score_line = next((line for line in lines if line.startswith('SCORE:')), 'SCORE: 5.0')
            rationale_line = next((line for line in lines if line.startswith('RATIONALE:')), 'RATIONALE: No detailed feedback available.')
            
            score = float(score_line.split('SCORE:')[1].strip())
            rationale = rationale_line.split('RATIONALE:')[1].strip()
            
            score = max(0.0, min(10.0, score))
            
            return score, rationale
            
        except Exception as e:
            print(f"Error evaluating {criterion.name}: {e}")
            return 5.0, f"Error during evaluation: {str(e)}"
    
    def calculate_final_score_node(self, state: AppState) -> AppState:
        print("🧮 Calculating final score...")
        total_weighted_score = 0.0
        total_weight = 0.0
        
        for criterion in state["criteria"]:
            score = state["photo"]["scores"].get(criterion.name, 0.0)
            weight = criterion.weight
            total_weighted_score += score * weight
            total_weight += weight
        
        final_score = total_weighted_score / total_weight if total_weight > 0 else 0.0
        state["photo"]["overall_score"] = round(final_score, 2)
        state["photo"]["stage"] = "scored"
        
        return state
    
    async def generate_overall_reasoning_node(self, state: AppState) -> AppState:
        print("📝 Generating overall reasoning...")
        photo_state = state["photo"]
        rules = state.get("competition_rules", "general photography principles")
        template = state["reasoning_prompt_template"]

        feedback_summary = "\n".join(
            f"- {name} (Score: {photo_state['scores'][name]}): {rationale}"
            for name, rationale in photo_state['rationales'].items()
        )

         # 1. Create the prompt directly from the raw template. DO NOT format it here.
        prompt = ChatPromptTemplate.from_template(template)
        
        # 2. Prepare a dictionary with the variables the template needs.
        prompt_variables = {
            "overall_score": photo_state["overall_score"],
            "rules": rules,
            "feedback_summary": feedback_summary
        }

        # 3. Create the chain and pass the variables dictionary to .ainvoke()
        chain = prompt | self.llm
        response = await chain.ainvoke(prompt_variables)

        photo_state["overall_reasoning"] = response.content
        photo_state["stage"] = "completed"
        return state

    async def judge_photo(self, photo_filename: str, image_data: str, criteria: List[JudgingCriterion],
                          competition_rules: Dict[str, Any], evaluation_prompt_template: str,
                          reasoning_prompt_template: str) -> Dict[str, Any]:
        
        workflow = self._build_workflow()
        initial_state = AppState(
            photo=PhotoState(
                image_data=image_data, filename=photo_filename, scores={},
                rationales={}, overall_score=0.0, overall_reasoning="", stage="input"
            ),
            criteria=criteria,
            competition_rules=competition_rules,
            evaluation_prompt_template=evaluation_prompt_template,
            reasoning_prompt_template=reasoning_prompt_template
        )
        final_state = await workflow.ainvoke(initial_state)
        photo_result = dict(final_state["photo"])
        photo_result.pop("image_data", None)

        return photo_result