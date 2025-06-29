# app/services/guideline_service.py

from fastapi import HTTPException
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import PromptTemplate

from ..crud import crud
from ..core.config import settings


async def generate_guidelines_from_search(competition_name: str, db: Session) -> dict:
    if not settings.TAVILY_API_KEY:
        raise HTTPException(status_code=500, detail="TAVILY_API_KEY not found.")
    
    synthesis_prompt = crud.get_enabled_prompt_by_type(db, "RULES_SYNTHESIS_PROMPT")
    if not synthesis_prompt:
        raise HTTPException(status_code=500, detail="No enabled RULES_SYNTHESIS_PROMPT found.")

    try:
        search_tool = TavilySearchResults(max_results=5)
        search_query = f'analysis of winning photos for "{competition_name}" competition.'
        results = search_tool.invoke({"query": search_query})
        aggregated_results = "\n\n".join([res["content"] for res in results])
        if not aggregated_results:
             raise HTTPException(status_code=404, detail="No search results found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Web search failed: {e}")

    try:
        llm = ChatGoogleGenerativeAI(model=settings.GEMINI_MODEL_NAME, temperature=settings.MODEL_TEMPERATURE)
        prompt = PromptTemplate.from_template(synthesis_prompt.template)
        chain = prompt | llm
        response = await chain.ainvoke({
            "competition_name": competition_name,
            "aggregated_search_results": aggregated_results
        })
        generated_guidelines = response.content.strip()
        return {"guidelines": generated_guidelines}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI synthesis failed: {e}")
