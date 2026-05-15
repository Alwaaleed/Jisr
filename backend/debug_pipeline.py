"""Run the agent pipeline standalone with verbose logging to see what fails."""
import asyncio
import logging
import sys

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stdout,
)

from app.agent import run_agent
from app.models import StudentProfile


async def main():
    profile = StudentProfile(
        major="Computer Science",
        industries=["Banking/Fintech", "Tech/SaaS"],
        roles=["Backend"],
        skills=["Python", "SQL"],
        languages=["Arabic", "English"],
        cities=["Riyadh"],
        dreamCompanies="",
    )
    print("=" * 60)
    print("RUNNING AGENT with profile:", profile.model_dump())
    print("=" * 60)

    matches = await run_agent(profile)

    print("=" * 60)
    print(f"FINAL: {len(matches)} matches")
    for m in matches:
        print(f"  - {m.company} | score={m.fitScore:.2f} | {m.applyUrl}")


asyncio.run(main())
