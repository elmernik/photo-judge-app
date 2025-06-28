import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, TypedDict
from dataclasses import dataclass
from dotenv import load_dotenv
import aiofiles
import base64

# LangGraph imports
from langgraph.graph import StateGraph, END

# LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

# Image processing
from PIL import Image

load_dotenv()

# Simplified data structures
class PhotoState(TypedDict):
    image_data: str
    filename: str
    scores: Dict[str, float]
    rationales: Dict[str, str]
    overall_score: float
    stage: str

class AppState(TypedDict):
    photo: PhotoState
    criteria: List[str]

@dataclass
class JudgingCriterion:
    name: str
    description: str
    weight: float = 1.0

class PhotoJudgeApp:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite-preview-06-17",
            temperature=0.3
        )
        self.photos_dir = Path("photos")
        self.photos_dir.mkdir(exist_ok=True)
        
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        workflow = StateGraph(AppState)
        
        workflow.add_node("evaluate_photo", self.evaluate_photo_node)
        workflow.add_node("calculate_final_score", self.calculate_final_score_node)
        workflow.add_node("generate_report", self.generate_report_node)
        
        workflow.set_entry_point("evaluate_photo")
        workflow.add_edge("evaluate_photo", "calculate_final_score")
        workflow.add_edge("calculate_final_score", "generate_report")
        workflow.add_edge("generate_report", END)
        
        return workflow.compile()
    
    async def evaluate_photo_node(self, state: AppState) -> AppState:
        print("🔍 Evaluating photo against criteria...")
        image_data = state["photo"]["image_data"]
        criteria_to_evaluate = state["criteria"] # Use criteria from the state

        async def evaluate(criterion: JudgingCriterion):
            print(f"  - Evaluating {criterion.name}...")
            return criterion.name, await self._evaluate_criterion(image_data, criterion)

        tasks = [evaluate(criterion) for criterion in criteria_to_evaluate]
        results = await asyncio.gather(*tasks)

        scores = {name: score for name, (score, _) in results}
        rationales = {name: rationale for name, (_, rationale) in results}

        state["photo"]["scores"] = scores
        state["photo"]["rationales"] = rationales
        state["photo"]["stage"] = "evaluated"
        return state
    
    async def _evaluate_criterion(self, image_data: str, criterion: JudgingCriterion) -> tuple[float, str]:
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"""You are an expert nature photography judge. Evaluate this photograph for {criterion.name}.

            {criterion.description}

            Provide:
            1. A score from 0.0 to 10.0
            2. A brief rationale (2-3 sentences)

            Format your response as:
            SCORE: [number]
            RATIONALE: [explanation]"""),
            ("user", [
                {"type": "text", "text": f"Please evaluate this nature photograph for {criterion.name}."},
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
    
    def generate_report_node(self, state: AppState) -> AppState:
        print("📋 Generating report...")
        state["photo"]["stage"] = "completed"
        return state
    
    async def judge_photo(self, photo_filename: str, image_data: str, criteria: List[JudgingCriterion]) -> Dict[str, Any]:
        print(f"🏁 Starting evaluation for: {photo_filename}")
        
        workflow = self._build_workflow()

        initial_state = AppState(
            photo=PhotoState(
                image_data=image_data,
                filename=photo_filename,
                scores={}, rationales={}, overall_score=0.0, stage="input"
            ),
            criteria=criteria
        )
        
        try:
            final_state = await workflow.ainvoke(initial_state)
            # Add final criteria used to the report
            final_state["photo"]["criteria_used"] = [c.name for c in criteria]
            return final_state["photo"]
        except Exception as e:
            print(f"❌ Error during evaluation: {e}")
            raise