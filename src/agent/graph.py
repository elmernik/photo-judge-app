"""
Nature Photography Competition Judge - Simplified MVP
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, TypedDict
from dataclasses import dataclass
from dotenv import load_dotenv
import aiofiles

# LangGraph imports
from langgraph.graph import StateGraph, END

# LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

# Image processing
from PIL import Image
import base64

load_dotenv()

# Simplified data structures
class PhotoState(TypedDict):
    photo_path: str
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
        
        # Simplified criteria
        self.criteria = [
            JudgingCriterion("Composition", "Rule of thirds, framing, balance", 1.0),
            JudgingCriterion("Technical_Quality", "Focus, exposure, sharpness", 1.2),
            JudgingCriterion("Creativity", "Unique perspective, artistic vision", 0.9),
            JudgingCriterion("Nature_Relevance", "Connection to nature, authenticity", 1.1),
            JudgingCriterion("Moment_Capture", "Timing, decisive moment", 0.8)
        ]
        
        # Build workflow
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """Build the simplified workflow"""
        workflow = StateGraph(AppState)
        
        # Add nodes
        workflow.add_node("load_photo", self.load_photo_node)
        workflow.add_node("evaluate_photo", self.evaluate_photo_node)
        workflow.add_node("calculate_final_score", self.calculate_final_score_node)
        workflow.add_node("generate_report", self.generate_report_node)
        
        # Define edges
        workflow.set_entry_point("load_photo")
        workflow.add_edge("load_photo", "evaluate_photo")
        workflow.add_edge("evaluate_photo", "calculate_final_score")
        workflow.add_edge("calculate_final_score", "generate_report")
        workflow.add_edge("generate_report", END)
        
        return workflow.compile()
    
    def load_photo_node(self, state: AppState) -> AppState:
        """Load and validate the photo"""
        photo_path = state["photo"]["photo_path"]
        
        if not Path(photo_path).exists():
            raise FileNotFoundError(f"Photo not found: {photo_path}")
        
        # Validate it's an image
        try:
            with Image.open(photo_path) as img:
                img.verify()
        except Exception as e:
            raise ValueError(f"Invalid image file: {e}")
        
        state["photo"]["stage"] = "loaded"
        print(f"✅ Loaded photo: {state['photo']['filename']}")
        
        return state
    
    async def evaluate_photo_node(self, state: AppState) -> AppState:
        """Evaluate the photo against all criteria"""
        print("🔍 Evaluating photo against criteria...")
        
        photo_path = state["photo"]["photo_path"]
        
        # Convert image to base64 for vision model
        image_data = await self._encode_image(photo_path)
        
        scores = {}
        rationales = {}
        
        for criterion in self.criteria:
            print(f"  - Evaluating {criterion.name}...")
            score, rationale = await self._evaluate_criterion(image_data, criterion)
            scores[criterion.name] = score
            rationales[criterion.name] = rationale
        
        state["photo"]["scores"] = scores
        state["photo"]["rationales"] = rationales
        state["photo"]["stage"] = "evaluated"
        
        return state
    
    async def _encode_image(self, image_path: str) -> str:
        """Asynchronously encode image to base64"""
        import aiofiles
        import base64

        async with aiofiles.open(image_path, "rb") as image_file:
            image_bytes = await image_file.read()
        return base64.b64encode(image_bytes).decode("utf-8")
    
    async def _evaluate_criterion(self, image_data: str, criterion: JudgingCriterion) -> tuple[float, str]:
        """Evaluate a single criterion using vision model"""
        
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
            
            # Parse score and rationale
            lines = content.split('\n')
            score_line = next((line for line in lines if line.startswith('SCORE:')), 'SCORE: 5.0')
            rationale_line = next((line for line in lines if line.startswith('RATIONALE:')), 'RATIONALE: No detailed feedback available.')
            
            score = float(score_line.split('SCORE:')[1].strip())
            rationale = rationale_line.split('RATIONALE:')[1].strip()
            
            # Clamp score to valid range
            score = max(0.0, min(10.0, score))
            
            return score, rationale
            
        except Exception as e:
            print(f"Error evaluating {criterion.name}: {e}")
            return 5.0, f"Error during evaluation: {str(e)}"
    
    def calculate_final_score_node(self, state: AppState) -> AppState:
        """Calculate weighted final score"""
        print("🧮 Calculating final score...")
        
        total_weighted_score = 0.0
        total_weight = 0.0
        
        for criterion in self.criteria:
            score = state["photo"]["scores"][criterion.name]
            weight = criterion.weight
            total_weighted_score += score * weight
            total_weight += weight
        
        final_score = total_weighted_score / total_weight if total_weight > 0 else 0.0
        state["photo"]["overall_score"] = round(final_score, 2)
        state["photo"]["stage"] = "scored"
        
        return state
    
    def generate_report_node(self, state: AppState) -> AppState:
        """Generate and display the final report"""
        print("📋 Generating report...")
        
        photo = state["photo"]
        
        # Create report
        report = {
            "filename": photo["filename"],
            "overall_score": photo["overall_score"],
            "timestamp": datetime.now().isoformat(),
            "detailed_scores": {}
        }
        
        # Display results
        print(f"\n{'='*50}")
        print(f"🏆 PHOTO EVALUATION REPORT")
        print(f"{'='*50}")
        print(f"📸 Photo: {photo['filename']}")
        print(f"⭐ Overall Score: {photo['overall_score']}/10.0")
        print(f"\n📊 Detailed Breakdown:")
        
        for criterion in self.criteria:
            name = criterion.name
            score = photo["scores"][name]
            rationale = photo["rationales"][name]
            weight = criterion.weight
            
            print(f"\n{name} (Weight: {weight})")
            print(f"  Score: {score}/10.0")
            print(f"  Rationale: {rationale}")
            
            report["detailed_scores"][name] = {
                "score": score,
                "weight": weight,
                "rationale": rationale
            }
        
        # Save report
        report_filename = f"report_{photo['filename'].split('.')[0]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n💾 Report saved to: {report_filename}")
        
        state["photo"]["stage"] = "completed"
        return state
    
    async def judge_photo(self, photo_filename: str) -> Dict[str, Any]:
        """Judge a single photo"""
        print(f"🏁 Starting evaluation for: {photo_filename}")
        
        # Build full path
        photo_path = self.photos_dir / photo_filename
        
        # Initialize state
        initial_state = AppState(
            photo=PhotoState(
                photo_path=str(photo_path),
                filename=photo_filename,
                scores={},
                rationales={},
                overall_score=0.0,
                stage="input"
            ),
            criteria=[c.name for c in self.criteria]
        )
        
        # Run workflow
        try:
            final_state = await self.workflow.ainvoke(initial_state)
            return final_state["photo"]
        except Exception as e:
            print(f"❌ Error during evaluation: {e}")
            raise


# Interface in LangGraph dev
app = PhotoJudgeApp()
graph = app.workflow