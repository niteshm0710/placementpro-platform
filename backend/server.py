from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import base64
import io
import random
import hashlib
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'placementpro-demo-secret-key-change-in-prod')
JWT_ALGO = 'HS256'
JWT_EXPIRE_HOURS = 24 * 7

app = FastAPI(title="PlacementPro AI API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ---------- Models ----------
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # student | hod | tpo
    department: Optional[str] = "Computer Science"
    roll_number: Optional[str] = None
    cgpa: Optional[float] = None
    year: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str
    user: Dict[str, Any]


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    roll_number: Optional[str] = None
    cgpa: Optional[float] = None
    year: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[List[str]] = None
    bio: Optional[str] = None


class ResumeUpload(BaseModel):
    filename: str
    content: str  # plain text or base64
    text: Optional[str] = None


class ResumeExtract(BaseModel):
    filename: str
    content_base64: str


class SkillGapRequest(BaseModel):
    target_role: str
    current_skills: List[str] = []


class InterviewStart(BaseModel):
    role: str
    difficulty: Optional[str] = "medium"


class InterviewSubmit(BaseModel):
    session_id: str
    answers: List[str]


class DriveCreate(BaseModel):
    company: str
    role: str
    package_lpa: float
    location: str
    eligibility_cgpa: float
    eligible_branches: List[str]
    drive_date: str
    description: str
    skills_required: List[str] = []


class ApplicationCreate(BaseModel):
    drive_id: str


class ShortlistUpdate(BaseModel):
    application_id: str
    status: str  # applied | shortlisted | interviewed | selected | rejected


class NotificationCreate(BaseModel):
    title: str
    message: str
    target_role: Optional[str] = None  # student/hod/tpo or None=all
    target_user_id: Optional[str] = None


# ---------- Utilities ----------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str, role: str) -> str:
    payload = {
        'sub': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing auth token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload['sub']}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*roles: str):
    async def dep(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if user['role'] not in roles:
            raise HTTPException(status_code=403, detail=f"Requires role: {roles}")
        return user
    return dep


def safe_user(u: Dict[str, Any]) -> Dict[str, Any]:
    u = dict(u)
    u.pop('_id', None)
    u.pop('password', None)
    return u


# ---------- Demo AI Logic ----------
TECH_SKILLS = [
    'python', 'java', 'javascript', 'typescript', 'c++', 'c', 'go', 'rust', 'sql',
    'html', 'css', 'react', 'angular', 'vue', 'node', 'express', 'fastapi', 'django',
    'flask', 'spring', 'mongodb', 'postgresql', 'mysql', 'redis', 'kafka', 'docker',
    'kubernetes', 'aws', 'azure', 'gcp', 'git', 'linux', 'tensorflow', 'pytorch',
    'pandas', 'numpy', 'machine learning', 'deep learning', 'nlp', 'data structures',
    'algorithms', 'system design', 'rest api', 'graphql', 'agile', 'scrum',
    'communication', 'leadership', 'problem solving', 'figma', 'tailwind', 'next.js'
]

ROLE_SKILL_MAP = {
    "Software Engineer": ["python", "java", "data structures", "algorithms", "git", "rest api", "sql", "system design", "problem solving"],
    "Frontend Developer": ["javascript", "react", "html", "css", "tailwind", "typescript", "next.js", "git"],
    "Backend Developer": ["python", "node", "fastapi", "express", "sql", "mongodb", "rest api", "docker", "git"],
    "Full Stack Developer": ["javascript", "react", "node", "mongodb", "rest api", "sql", "git", "docker"],
    "Data Scientist": ["python", "pandas", "numpy", "machine learning", "deep learning", "sql", "tensorflow"],
    "Data Analyst": ["sql", "python", "pandas", "excel", "powerbi", "tableau", "communication"],
    "DevOps Engineer": ["linux", "docker", "kubernetes", "aws", "git", "python", "ci/cd"],
    "ML Engineer": ["python", "tensorflow", "pytorch", "machine learning", "deep learning", "nlp", "docker"],
    "Cloud Engineer": ["aws", "azure", "gcp", "docker", "kubernetes", "linux", "python"],
    "Mobile Developer": ["java", "kotlin", "swift", "react native", "flutter", "git"],
}

COURSES_CATALOG = {
    "python": {"title": "Python for Everybody", "provider": "Coursera", "url": "https://www.coursera.org/specializations/python"},
    "java": {"title": "Java Programming Masterclass", "provider": "Udemy", "url": "https://www.udemy.com/course/java-the-complete-java-developer-course/"},
    "javascript": {"title": "The Complete JavaScript Course", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-javascript-course/"},
    "typescript": {"title": "Understanding TypeScript", "provider": "Udemy", "url": "https://www.udemy.com/course/understanding-typescript/"},
    "react": {"title": "React - The Complete Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/"},
    "node": {"title": "The Complete Node.js Developer Course", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/"},
    "fastapi": {"title": "FastAPI - The Complete Course", "provider": "Udemy", "url": "https://www.udemy.com/course/fastapi-the-complete-course/"},
    "express": {"title": "Node with Express", "provider": "FreeCodeCamp", "url": "https://www.freecodecamp.org/learn/back-end-development-and-apis/"},
    "mongodb": {"title": "MongoDB - The Complete Developer's Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/mongodb-the-complete-developers-guide/"},
    "sql": {"title": "Learn SQL Basics for Data Science", "provider": "Coursera", "url": "https://www.coursera.org/specializations/learn-sql-basics-data-science"},
    "data structures": {"title": "Data Structures & Algorithms", "provider": "Coursera", "url": "https://www.coursera.org/specializations/data-structures-algorithms"},
    "algorithms": {"title": "Algorithms Specialization", "provider": "Coursera", "url": "https://www.coursera.org/specializations/algorithms"},
    "system design": {"title": "System Design Interview Prep", "provider": "Educative", "url": "https://www.educative.io/courses/grokking-the-system-design-interview"},
    "machine learning": {"title": "Machine Learning by Andrew Ng", "provider": "Coursera", "url": "https://www.coursera.org/learn/machine-learning"},
    "deep learning": {"title": "Deep Learning Specialization", "provider": "Coursera", "url": "https://www.coursera.org/specializations/deep-learning"},
    "tensorflow": {"title": "TensorFlow Developer Certificate", "provider": "Coursera", "url": "https://www.coursera.org/professional-certificates/tensorflow-in-practice"},
    "pytorch": {"title": "PyTorch for Deep Learning", "provider": "Udemy", "url": "https://www.udemy.com/course/pytorch-for-deep-learning-with-python-bootcamp/"},
    "pandas": {"title": "Pandas Data Analysis", "provider": "DataCamp", "url": "https://www.datacamp.com/courses/data-manipulation-with-pandas"},
    "numpy": {"title": "Intro to NumPy", "provider": "DataCamp", "url": "https://www.datacamp.com/courses/introduction-to-numpy"},
    "nlp": {"title": "Natural Language Processing Specialization", "provider": "Coursera", "url": "https://www.coursera.org/specializations/natural-language-processing"},
    "docker": {"title": "Docker Mastery", "provider": "Udemy", "url": "https://www.udemy.com/course/docker-mastery/"},
    "kubernetes": {"title": "Kubernetes for Developers", "provider": "Linux Foundation", "url": "https://training.linuxfoundation.org/training/kubernetes-for-developers/"},
    "aws": {"title": "AWS Certified Cloud Practitioner", "provider": "AWS", "url": "https://aws.amazon.com/training/learn-about/cloud-practitioner/"},
    "azure": {"title": "Microsoft Azure Fundamentals", "provider": "Microsoft", "url": "https://learn.microsoft.com/en-us/training/courses/az-900t00"},
    "gcp": {"title": "Google Cloud Fundamentals", "provider": "Coursera", "url": "https://www.coursera.org/learn/gcp-fundamentals"},
    "linux": {"title": "Linux Command Line Basics", "provider": "Coursera", "url": "https://www.coursera.org/learn/unix"},
    "git": {"title": "Git Complete Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/git-complete/"},
    "rest api": {"title": "REST API Design Best Practices", "provider": "Pluralsight", "url": "https://www.pluralsight.com/courses/api-design"},
    "graphql": {"title": "The Modern GraphQL Bootcamp", "provider": "Udemy", "url": "https://www.udemy.com/course/graphql-bootcamp/"},
    "tailwind": {"title": "Tailwind CSS From Scratch", "provider": "Udemy", "url": "https://www.udemy.com/course/tailwind-from-scratch/"},
    "html": {"title": "HTML, CSS, and JavaScript for Web Developers", "provider": "Coursera", "url": "https://www.coursera.org/learn/html-css-javascript-for-web-developers"},
    "css": {"title": "Advanced CSS and Sass", "provider": "Udemy", "url": "https://www.udemy.com/course/advanced-css-and-sass/"},
    "next.js": {"title": "Next.js Complete Course", "provider": "Udemy", "url": "https://www.udemy.com/course/nextjs-react-the-complete-guide/"},
    "communication": {"title": "Improving Communication Skills", "provider": "Coursera", "url": "https://www.coursera.org/learn/wharton-communication-skills"},
    "leadership": {"title": "Leading People and Teams", "provider": "Coursera", "url": "https://www.coursera.org/specializations/leading-teams"},
    "problem solving": {"title": "Solving Complex Problems", "provider": "edX", "url": "https://www.edx.org/learn/problem-solving"},
}

INTERVIEW_QUESTIONS = {
    "easy": [
        "Tell me about yourself and your career goals.",
        "What programming languages are you most comfortable with and why?",
        "Describe a project you are proud of and your role in it.",
        "What are your biggest strengths as a software engineer?",
        "Why do you want to work for our company?",
    ],
    "medium": [
        "Explain the difference between SQL and NoSQL databases. When would you choose one over the other?",
        "Walk me through how you would design a URL shortener like bit.ly.",
        "Describe a challenging bug you fixed. What was your debugging process?",
        "Explain the concept of REST APIs and their best practices.",
        "How do you ensure code quality in your projects?",
    ],
    "hard": [
        "Design a distributed rate limiter that handles 1M requests/sec.",
        "Explain CAP theorem with real-world examples for each combination.",
        "Walk me through scaling a monolith to microservices. What pitfalls would you avoid?",
        "Implement an LRU cache and analyze its time complexity.",
        "How would you handle eventual consistency in a globally distributed database?",
    ],
}


def extract_skills_from_text(text: str) -> List[str]:
    if not text:
        return []
    t = text.lower()
    found = []
    for skill in TECH_SKILLS:
        if re.search(r'\b' + re.escape(skill) + r'\b', t):
            found.append(skill)
    return list(dict.fromkeys(found))


def deterministic_score(seed_text: str, lo: int, hi: int) -> int:
    h = int(hashlib.md5((seed_text or "x").encode()).hexdigest(), 16)
    return lo + (h % (hi - lo + 1))


def analyze_resume_demo(text: str, filename: str) -> Dict[str, Any]:
    skills = extract_skills_from_text(text)
    words = len(text.split()) if text else 0
    base = deterministic_score(filename + str(words), 55, 92)
    ats = min(98, base + min(15, len(skills)))
    quality = min(95, base + (5 if words > 200 else -5) + (5 if "experience" in (text or "").lower() else 0))
    quality = max(40, min(98, quality))

    strengths = []
    if len(skills) >= 6:
        strengths.append("Strong technical skill coverage across multiple domains")
    if "intern" in (text or "").lower() or "experience" in (text or "").lower():
        strengths.append("Demonstrated practical experience through internships or projects")
    if "project" in (text or "").lower():
        strengths.append("Project-oriented portfolio showcases applied learning")
    if words > 300:
        strengths.append("Comprehensive resume content with sufficient detail")
    if not strengths:
        strengths = ["Clear formatting and structure", "Well-defined contact section"]

    weaknesses = []
    if len(skills) < 5:
        weaknesses.append("Limited list of technical skills - add more relevant technologies")
    if words < 200:
        weaknesses.append("Resume content is too brief - expand on experience and projects")
    if "github" not in (text or "").lower() and "portfolio" not in (text or "").lower():
        weaknesses.append("Missing links to GitHub or portfolio for code samples")
    if "achievement" not in (text or "").lower() and "award" not in (text or "").lower():
        weaknesses.append("No quantifiable achievements or awards mentioned")
    if not weaknesses:
        weaknesses = ["Could add more measurable impact metrics", "Consider tailoring for each role"]

    suggestions = [
        "Add quantifiable metrics to project descriptions (e.g., 'reduced load time by 40%')",
        "Include relevant certifications and online course completions",
        "Use action verbs like 'engineered', 'optimized', 'deployed' to start bullet points",
        "Ensure the resume is a single page and ATS-friendly (no images/tables in headers)",
        "Add a concise professional summary at the top tailored to the target role",
    ]

    return {
        "ats_score": int(ats),
        "quality_score": int(quality),
        "skills": skills[:25],
        "strengths": strengths[:5],
        "weaknesses": weaknesses[:5],
        "suggestions": suggestions,
        "word_count": words,
    }


def skill_gap_demo(target_role: str, current_skills: List[str]) -> Dict[str, Any]:
    required = ROLE_SKILL_MAP.get(target_role, ROLE_SKILL_MAP["Software Engineer"])
    cur = set(s.lower().strip() for s in current_skills)
    matched = [s for s in required if s in cur]
    missing = [s for s in required if s not in cur]
    courses = []
    for m in missing:
        c = COURSES_CATALOG.get(m)
        if c:
            courses.append({"skill": m, **c})
        else:
            courses.append({
                "skill": m,
                "title": f"{m.title()} Fundamentals",
                "provider": "Coursera",
                "url": f"https://www.coursera.org/search?query={m.replace(' ', '%20')}"
            })
    match_pct = int((len(matched) / max(1, len(required))) * 100)
    return {
        "target_role": target_role,
        "match_percentage": match_pct,
        "matched_skills": matched,
        "missing_skills": missing,
        "course_recommendations": courses,
    }


def placement_prediction_demo(user: Dict[str, Any]) -> Dict[str, Any]:
    cgpa = float(user.get("cgpa") or 7.0)
    skills = user.get("skills") or []
    projects = user.get("projects_count", len(skills) // 3 + 1)
    has_resume = bool(user.get("resume_id"))

    score = 0.0
    score += min(40, cgpa * 4)  # cgpa weight
    score += min(30, len(skills) * 3)
    score += min(15, projects * 5)
    score += 10 if has_resume else 0
    score += 5  # baseline
    score = max(20, min(98, score))

    readiness = "Excellent" if score >= 85 else "Good" if score >= 70 else "Average" if score >= 55 else "Needs Improvement"

    improvements = []
    if cgpa < 7.5:
        improvements.append("Improve CGPA - aim for 7.5+ to unlock more drives")
    if len(skills) < 8:
        improvements.append("Add more technical skills to your profile (target 8+)")
    if projects < 3:
        improvements.append("Build at least 3 substantial portfolio projects with GitHub links")
    if not has_resume:
        improvements.append("Upload a polished resume and run the ATS analyzer")
    improvements.append("Practice mock interviews regularly - aim for 5+ sessions")
    improvements.append("Apply to 10+ relevant placement drives consistently")

    return {
        "placement_probability": int(score),
        "readiness_level": readiness,
        "improvement_areas": improvements[:6],
        "factors": {
            "cgpa": cgpa,
            "skills_count": len(skills),
            "projects_count": projects,
            "has_resume": has_resume,
        }
    }


def interview_feedback_demo(question: str, answer: str) -> Dict[str, Any]:
    a = (answer or "").strip()
    words = len(a.split())
    if words == 0:
        return {"score": 0, "feedback": "No answer provided. Take time to structure your response."}
    score = deterministic_score(question + a, 55, 95)
    if words < 20:
        score = max(30, score - 25)
    elif words > 80:
        score = min(98, score + 5)

    feedback_parts = []
    if words < 20:
        feedback_parts.append("Answer is too brief - elaborate with specific examples.")
    elif words > 150:
        feedback_parts.append("Answer is comprehensive but try to be more concise.")
    else:
        feedback_parts.append("Good length and structure.")

    if any(w in a.lower() for w in ["example", "experience", "project", "implemented", "designed"]):
        feedback_parts.append("Strong use of concrete examples.")
    else:
        feedback_parts.append("Add specific examples from your projects or experience.")

    if any(w in a.lower() for w in ["because", "therefore", "result", "impact", "outcome"]):
        feedback_parts.append("Good reasoning and impact-driven explanation.")
    else:
        feedback_parts.append("Try the STAR method (Situation, Task, Action, Result).")

    return {"score": int(score), "feedback": " ".join(feedback_parts)}


# ---------- Auth Routes ----------
@api.post("/auth/signup", response_model=TokenResponse)
async def signup(payload: UserSignup):
    if payload.role not in ("student", "hod", "tpo"):
        raise HTTPException(status_code=400, detail="Invalid role")
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "email": payload.email.lower(),
        "password": hash_pw(payload.password),
        "role": payload.role,
        "department": payload.department or "Computer Science",
        "roll_number": payload.roll_number,
        "cgpa": payload.cgpa,
        "year": payload.year,
        "phone": None,
        "skills": [],
        "bio": None,
        "resume_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = make_token(user_doc["id"], user_doc["role"])
    return {"token": token, "user": safe_user(user_doc)}


@api.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_pw(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = make_token(user["id"], user["role"])
    return {"token": token, "user": safe_user(user)}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ---------- Profile ----------
@api.put("/profile")
async def update_profile(payload: ProfileUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return updated


# ---------- Resume ----------
def extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract readable text from PDF bytes. Tries pdfplumber first, falls back to pypdf."""
    def _clean(t: str) -> str:
        # remove null bytes & control chars (keep newlines/tabs)
        t = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", t or "")
        t = re.sub(r"\n{3,}", "\n\n", t)
        return t.strip()

    # Attempt 1: pdfplumber (better for complex layouts)
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            parts = []
            for page in pdf.pages:
                try:
                    t = page.extract_text() or ""
                    if t.strip():
                        parts.append(t)
                except Exception:
                    continue
            text = "\n".join(parts)
            text = _clean(text)
            if text:
                return text
    except Exception as e:
        logger.warning(f"pdfplumber extract failed: {e}")

    # Attempt 2: pypdf fallback
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(pdf_bytes))
        parts = []
        for page in reader.pages:
            try:
                parts.append(page.extract_text() or "")
            except Exception:
                continue
        text = "\n".join(parts)
        text = _clean(text)
        return text
    except Exception as e:
        logger.warning(f"pypdf extract failed: {e}")
        return ""


def looks_like_pdf(data: bytes) -> bool:
    return data[:5] == b"%PDF-"


@api.post("/resume/extract")
async def resume_extract(payload: ResumeExtract, user=Depends(require_role("student"))):
    """Decode base64 file content (PDF/text), return clean readable text."""
    try:
        raw = base64.b64decode(payload.content_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 content")
    fname = (payload.filename or "").lower()
    text = ""
    if fname.endswith(".pdf") or looks_like_pdf(raw):
        text = extract_pdf_text(raw)
        if not text:
            raise HTTPException(status_code=422, detail="Could not extract text. Please paste resume text manually.")
    else:
        # treat as plain text
        try:
            text = raw.decode("utf-8", errors="ignore")
        except Exception:
            text = ""
    return {"filename": payload.filename, "text": text[:50000], "char_count": len(text)}


@api.post("/resume/upload")
async def upload_resume(payload: ResumeUpload, user=Depends(require_role("student"))):
    text = payload.text or ""
    if not text and payload.content:
        # try to decode base64
        try:
            raw = base64.b64decode(payload.content)
            if looks_like_pdf(raw):
                text = extract_pdf_text(raw)
            else:
                text = raw.decode("utf-8", errors="ignore")
        except Exception:
            text = payload.content
    # Reject PDF binary leaking into text field
    head = (text or "")[:1000]
    binary_markers = ["%PDF-", "endobj", "0 obj", "stream\n", "/Type /Page", "xref"]
    if any(m in head for m in binary_markers):
        raise HTTPException(status_code=400, detail="Could not extract text. Please paste resume text manually.")
    resume_id = str(uuid.uuid4())
    doc = {
        "id": resume_id,
        "user_id": user["id"],
        "filename": payload.filename,
        "text": text[:50000],
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.resumes.replace_one({"user_id": user["id"]}, doc, upsert=True)
    # also update user
    skills = extract_skills_from_text(text)
    await db.users.update_one({"id": user["id"]}, {"$set": {"resume_id": resume_id, "skills": skills}})
    return {"id": resume_id, "filename": payload.filename, "uploaded_at": doc["uploaded_at"]}


@api.get("/resume")
async def get_resume(user=Depends(get_current_user)):
    r = await db.resumes.find_one({"user_id": user["id"]}, {"_id": 0})
    if not r:
        return None
    return r


@api.post("/resume/analyze")
async def analyze_resume(user=Depends(require_role("student"))):
    r = await db.resumes.find_one({"user_id": user["id"]}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Upload a resume first")
    analysis = analyze_resume_demo(r.get("text", ""), r.get("filename", "resume.pdf"))
    await db.users.update_one({"id": user["id"]}, {"$set": {"skills": analysis["skills"]}})
    return analysis


# HOD: view student resumes in their department
@api.get("/resumes/department")
async def department_resumes(user=Depends(require_role("hod"))):
    students = await db.users.find(
        {"role": "student", "department": user["department"]},
        {"_id": 0, "password": 0}
    ).to_list(500)
    out = []
    for s in students:
        r = await db.resumes.find_one({"user_id": s["id"]}, {"_id": 0})
        out.append({
            "student": s,
            "resume": r,
            "analysis": analyze_resume_demo(r.get("text", "") if r else "", r.get("filename", "") if r else "") if r else None
        })
    return out


# ---------- Skill Gap ----------
@api.post("/skill-gap")
async def skill_gap(payload: SkillGapRequest, user=Depends(get_current_user)):
    skills = payload.current_skills or user.get("skills") or []
    return skill_gap_demo(payload.target_role, skills)


@api.get("/skill-gap/roles")
async def skill_gap_roles():
    return list(ROLE_SKILL_MAP.keys())


# HOD: skill gap overview for department
@api.get("/skill-gap/overview")
async def skill_gap_overview(user=Depends(require_role("hod"))):
    students = await db.users.find(
        {"role": "student", "department": user["department"]},
        {"_id": 0, "password": 0}
    ).to_list(500)
    skill_counts: Dict[str, int] = {}
    for s in students:
        for sk in (s.get("skills") or []):
            skill_counts[sk] = skill_counts.get(sk, 0) + 1
    top = sorted(skill_counts.items(), key=lambda x: -x[1])[:15]
    target = "Software Engineer"
    required = ROLE_SKILL_MAP[target]
    missing_aggregate = {}
    for s in students:
        cur = set(s.get("skills") or [])
        for r in required:
            if r not in cur:
                missing_aggregate[r] = missing_aggregate.get(r, 0) + 1
    most_missing = sorted(missing_aggregate.items(), key=lambda x: -x[1])[:10]
    return {
        "student_count": len(students),
        "top_skills": [{"skill": k, "count": v} for k, v in top],
        "most_missing_skills": [{"skill": k, "count": v} for k, v in most_missing],
        "target_role": target,
    }


# ---------- Placement Prediction ----------
@api.get("/placement-prediction")
async def placement_prediction(user=Depends(get_current_user)):
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return placement_prediction_demo(fresh)


# ---------- Mock Interview ----------
@api.post("/interview/start")
async def interview_start(payload: InterviewStart, user=Depends(get_current_user)):
    diff = payload.difficulty if payload.difficulty in INTERVIEW_QUESTIONS else "medium"
    questions = list(INTERVIEW_QUESTIONS[diff])
    session_id = str(uuid.uuid4())
    doc = {
        "id": session_id,
        "user_id": user["id"],
        "role": payload.role,
        "difficulty": diff,
        "questions": questions,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed": False,
    }
    await db.interview_sessions.insert_one(doc)
    return {"session_id": session_id, "questions": questions, "role": payload.role, "difficulty": diff}


@api.post("/interview/submit")
async def interview_submit(payload: InterviewSubmit, user=Depends(get_current_user)):
    session = await db.interview_sessions.find_one({"id": payload.session_id, "user_id": user["id"]}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    results = []
    total = 0
    for q, a in zip(session["questions"], payload.answers):
        fb = interview_feedback_demo(q, a)
        results.append({"question": q, "answer": a, **fb})
        total += fb["score"]
    avg = int(total / max(1, len(results)))
    overall = "Excellent" if avg >= 85 else "Good" if avg >= 70 else "Average" if avg >= 55 else "Needs Practice"
    await db.interview_sessions.update_one(
        {"id": payload.session_id},
        {"$set": {"completed": True, "results": results, "average_score": avg, "submitted_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"session_id": payload.session_id, "average_score": avg, "overall": overall, "results": results}


@api.get("/interview/history")
async def interview_history(user=Depends(get_current_user)):
    sessions = await db.interview_sessions.find({"user_id": user["id"]}, {"_id": 0}).sort("started_at", -1).to_list(50)
    return sessions


# ---------- Drives ----------
@api.get("/drives")
async def list_drives(user=Depends(get_current_user)):
    drives = await db.drives.find({}, {"_id": 0}).sort("drive_date", 1).to_list(500)
    # mark if user (student) already applied
    if user["role"] == "student":
        apps = await db.applications.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
        applied_ids = {a["drive_id"] for a in apps}
        for d in drives:
            d["applied"] = d["id"] in applied_ids
    return drives


@api.post("/drives")
async def create_drive(payload: DriveCreate, user=Depends(require_role("tpo"))):
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.drives.insert_one(doc)
    # broadcast notification to students
    note = {
        "id": str(uuid.uuid4()),
        "title": f"New Drive: {payload.company}",
        "message": f"{payload.company} hiring for {payload.role} ({payload.package_lpa} LPA). Apply now!",
        "target_role": "student",
        "target_user_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read_by": [],
    }
    await db.notifications.insert_one(note)
    doc.pop("_id", None)
    return doc


@api.put("/drives/{drive_id}")
async def update_drive(drive_id: str, payload: DriveCreate, user=Depends(require_role("tpo"))):
    await db.drives.update_one({"id": drive_id}, {"$set": payload.model_dump()})
    return {"ok": True}


@api.delete("/drives/{drive_id}")
async def delete_drive(drive_id: str, user=Depends(require_role("tpo"))):
    await db.drives.delete_one({"id": drive_id})
    await db.applications.delete_many({"drive_id": drive_id})
    return {"ok": True}


# ---------- Applications ----------
@api.post("/applications")
async def apply_to_drive(payload: ApplicationCreate, user=Depends(require_role("student"))):
    drive = await db.drives.find_one({"id": payload.drive_id}, {"_id": 0})
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    existing = await db.applications.find_one({"user_id": user["id"], "drive_id": payload.drive_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this drive")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "drive_id": payload.drive_id,
        "status": "applied",
        "applied_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.applications.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/applications")
async def my_applications(user=Depends(get_current_user)):
    if user["role"] == "student":
        apps = await db.applications.find({"user_id": user["id"]}, {"_id": 0}).sort("applied_at", -1).to_list(500)
        for a in apps:
            d = await db.drives.find_one({"id": a["drive_id"]}, {"_id": 0})
            a["drive"] = d
        return apps
    # TPO/HOD: all applications
    apps = await db.applications.find({}, {"_id": 0}).sort("applied_at", -1).to_list(2000)
    out = []
    for a in apps:
        d = await db.drives.find_one({"id": a["drive_id"]}, {"_id": 0})
        s = await db.users.find_one({"id": a["user_id"]}, {"_id": 0, "password": 0})
        if user["role"] == "hod" and (not s or s.get("department") != user["department"]):
            continue
        a["drive"] = d
        a["student"] = s
        out.append(a)
    return out


@api.put("/applications/status")
async def update_app_status(payload: ShortlistUpdate, user=Depends(require_role("tpo"))):
    if payload.status not in ("applied", "shortlisted", "interviewed", "selected", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")
    app_doc = await db.applications.find_one({"id": payload.application_id})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.applications.update_one({"id": payload.application_id}, {"$set": {"status": payload.status}})
    # notify student
    note = {
        "id": str(uuid.uuid4()),
        "title": f"Application Update",
        "message": f"Your application status has been updated to: {payload.status.upper()}",
        "target_role": None,
        "target_user_id": app_doc["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read_by": [],
    }
    await db.notifications.insert_one(note)
    return {"ok": True}


# ---------- Courses ----------
@api.get("/courses/recommend")
async def courses_recommend(user=Depends(get_current_user)):
    skills = user.get("skills") or []
    target_role = "Software Engineer"
    gap = skill_gap_demo(target_role, skills)
    return {
        "based_on_role": target_role,
        "courses": gap["course_recommendations"],
    }


@api.get("/courses")
async def list_courses():
    return [{"skill": k, **v} for k, v in COURSES_CATALOG.items()]


# ---------- Notifications ----------
@api.get("/notifications")
async def list_notifications(user=Depends(get_current_user)):
    q = {"$or": [{"target_role": user["role"]}, {"target_user_id": user["id"]}, {"target_role": None, "target_user_id": None}]}
    notes = await db.notifications.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    for n in notes:
        n["read"] = user["id"] in (n.get("read_by") or [])
    return notes


@api.post("/notifications")
async def create_notification(payload: NotificationCreate, user=Depends(require_role("tpo", "hod"))):
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read_by": [],
    }
    await db.notifications.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/notifications/{note_id}/read")
async def mark_read(note_id: str, user=Depends(get_current_user)):
    await db.notifications.update_one({"id": note_id}, {"$addToSet": {"read_by": user["id"]}})
    return {"ok": True}


# ---------- Analytics ----------
@api.get("/analytics/hod")
async def hod_analytics(user=Depends(require_role("hod"))):
    dept = user["department"]
    students = await db.users.find({"role": "student", "department": dept}, {"_id": 0, "password": 0}).to_list(500)
    student_ids = {s["id"] for s in students}
    apps = await db.applications.find({}, {"_id": 0}).to_list(5000)
    dept_apps = [a for a in apps if a["user_id"] in student_ids]
    selected = [a for a in dept_apps if a["status"] == "selected"]
    by_status = {}
    for a in dept_apps:
        by_status[a["status"]] = by_status.get(a["status"], 0) + 1

    # avg cgpa
    cgpas = [float(s.get("cgpa")) for s in students if s.get("cgpa") is not None]
    avg_cgpa = round(sum(cgpas) / len(cgpas), 2) if cgpas else 0

    # placements by company (selected)
    by_company = {}
    for a in selected:
        d = await db.drives.find_one({"id": a["drive_id"]}, {"_id": 0})
        if d:
            by_company[d["company"]] = by_company.get(d["company"], 0) + 1

    # top performers
    perf = []
    for s in students:
        student_apps = [a for a in dept_apps if a["user_id"] == s["id"]]
        sel = len([a for a in student_apps if a["status"] == "selected"])
        perf.append({
            "id": s["id"],
            "name": s["name"],
            "roll_number": s.get("roll_number"),
            "cgpa": s.get("cgpa"),
            "applications": len(student_apps),
            "selected": sel,
            "skills_count": len(s.get("skills") or []),
        })
    perf.sort(key=lambda x: (x["selected"], x["cgpa"] or 0), reverse=True)

    return {
        "department": dept,
        "total_students": len(students),
        "placed_students": len(set(a["user_id"] for a in selected)),
        "total_applications": len(dept_apps),
        "average_cgpa": avg_cgpa,
        "applications_by_status": by_status,
        "placements_by_company": [{"company": k, "count": v} for k, v in by_company.items()],
        "top_performers": perf[:10],
    }


@api.get("/analytics/tpo")
async def tpo_analytics(user=Depends(require_role("tpo"))):
    students = await db.users.find({"role": "student"}, {"_id": 0, "password": 0}).to_list(2000)
    drives = await db.drives.find({}, {"_id": 0}).to_list(500)
    apps = await db.applications.find({}, {"_id": 0}).to_list(5000)
    selected = [a for a in apps if a["status"] == "selected"]

    by_dept = {}
    for s in students:
        d = s.get("department", "Unknown")
        by_dept.setdefault(d, {"total": 0, "placed": set()})
        by_dept[d]["total"] += 1
    for a in selected:
        s = next((x for x in students if x["id"] == a["user_id"]), None)
        if s:
            by_dept.setdefault(s.get("department", "Unknown"), {"total": 0, "placed": set()})
            by_dept[s.get("department", "Unknown")]["placed"].add(s["id"])

    dept_report = [{"department": k, "total": v["total"], "placed": len(v["placed"])} for k, v in by_dept.items()]

    by_company = {}
    for a in selected:
        d = next((x for x in drives if x["id"] == a["drive_id"]), None)
        if d:
            by_company[d["company"]] = by_company.get(d["company"], 0) + 1

    by_status = {}
    for a in apps:
        by_status[a["status"]] = by_status.get(a["status"], 0) + 1

    avg_package = 0
    if selected:
        packages = []
        for a in selected:
            d = next((x for x in drives if x["id"] == a["drive_id"]), None)
            if d:
                packages.append(d["package_lpa"])
        avg_package = round(sum(packages) / max(1, len(packages)), 2)

    return {
        "total_students": len(students),
        "total_drives": len(drives),
        "total_applications": len(apps),
        "placed_students": len(set(a["user_id"] for a in selected)),
        "average_package_lpa": avg_package,
        "by_department": dept_report,
        "by_company": [{"company": k, "count": v} for k, v in by_company.items()],
        "by_status": by_status,
    }


# ---------- TPO: Students Management ----------
@api.get("/students")
async def list_students(user=Depends(require_role("tpo", "hod"))):
    q = {"role": "student"}
    if user["role"] == "hod":
        q["department"] = user["department"]
    students = await db.users.find(q, {"_id": 0, "password": 0}).to_list(2000)
    # enrich with app counts
    apps = await db.applications.find({}, {"_id": 0}).to_list(5000)
    for s in students:
        sa = [a for a in apps if a["user_id"] == s["id"]]
        s["applications_count"] = len(sa)
        s["selected_count"] = len([a for a in sa if a["status"] == "selected"])
    return students


# ---------- Seed Data ----------
async def seed_data():
    count = await db.users.count_documents({})
    if count > 0:
        return
    logger.info("Seeding demo data...")
    # Demo accounts
    demo_users = [
        {"role": "student", "name": "Aarav Sharma", "email": "student@demo.com", "password": "password123",
         "department": "Computer Science", "roll_number": "CS21B001", "cgpa": 8.4, "year": "Final Year"},
        {"role": "student", "name": "Priya Iyer", "email": "priya@demo.com", "password": "password123",
         "department": "Computer Science", "roll_number": "CS21B002", "cgpa": 9.1, "year": "Final Year"},
        {"role": "student", "name": "Rohan Mehta", "email": "rohan@demo.com", "password": "password123",
         "department": "Computer Science", "roll_number": "CS21B003", "cgpa": 7.6, "year": "Final Year"},
        {"role": "student", "name": "Sara Khan", "email": "sara@demo.com", "password": "password123",
         "department": "Electronics", "roll_number": "EC21B005", "cgpa": 8.0, "year": "Final Year"},
        {"role": "student", "name": "Vikram Singh", "email": "vikram@demo.com", "password": "password123",
         "department": "Mechanical", "roll_number": "ME21B007", "cgpa": 7.2, "year": "Final Year"},
        {"role": "hod", "name": "Dr. Anjali Verma", "email": "hod@demo.com", "password": "password123",
         "department": "Computer Science"},
        {"role": "tpo", "name": "Prof. Rajesh Kumar", "email": "tpo@demo.com", "password": "password123",
         "department": "Placement Cell"},
    ]
    student_ids = []
    for u in demo_users:
        doc = {
            "id": str(uuid.uuid4()),
            "name": u["name"],
            "email": u["email"],
            "password": hash_pw(u["password"]),
            "role": u["role"],
            "department": u.get("department"),
            "roll_number": u.get("roll_number"),
            "cgpa": u.get("cgpa"),
            "year": u.get("year"),
            "phone": None,
            "skills": ["python", "java", "sql", "git", "react"] if u["role"] == "student" else [],
            "bio": None,
            "resume_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(doc)
        if u["role"] == "student":
            student_ids.append(doc["id"])

    # Drives
    drives = [
        {"company": "Google", "role": "Software Engineer", "package_lpa": 28.0, "location": "Bengaluru",
         "eligibility_cgpa": 8.0, "eligible_branches": ["Computer Science", "Electronics"], "drive_date": "2026-02-15",
         "description": "Looking for passionate engineers to build scalable products.",
         "skills_required": ["python", "data structures", "algorithms", "system design"]},
        {"company": "Microsoft", "role": "SDE-1", "package_lpa": 24.0, "location": "Hyderabad",
         "eligibility_cgpa": 7.5, "eligible_branches": ["Computer Science", "Electronics"], "drive_date": "2026-02-22",
         "description": "Join the cloud and AI team at Microsoft.",
         "skills_required": ["c++", "java", "data structures", "azure"]},
        {"company": "Amazon", "role": "SDE Intern", "package_lpa": 18.0, "location": "Bengaluru",
         "eligibility_cgpa": 7.0, "eligible_branches": ["Computer Science", "Electronics", "Mechanical"], "drive_date": "2026-03-05",
         "description": "6-month SDE internship with pre-placement offer opportunity.",
         "skills_required": ["python", "aws", "data structures", "git"]},
        {"company": "TCS", "role": "Systems Engineer", "package_lpa": 7.5, "location": "Pune",
         "eligibility_cgpa": 6.5, "eligible_branches": ["Computer Science", "Electronics", "Mechanical", "Civil"], "drive_date": "2026-02-10",
         "description": "Mass recruitment drive for TCS Digital and Ninja roles.",
         "skills_required": ["java", "sql", "communication"]},
        {"company": "Infosys", "role": "Power Programmer", "package_lpa": 9.0, "location": "Bengaluru",
         "eligibility_cgpa": 7.0, "eligible_branches": ["Computer Science", "Electronics"], "drive_date": "2026-02-28",
         "description": "Premium hiring track at Infosys for top performers.",
         "skills_required": ["java", "spring", "sql", "rest api"]},
        {"company": "Flipkart", "role": "Full Stack Developer", "package_lpa": 22.0, "location": "Bengaluru",
         "eligibility_cgpa": 7.5, "eligible_branches": ["Computer Science"], "drive_date": "2026-03-12",
         "description": "Build the next generation of e-commerce experiences.",
         "skills_required": ["javascript", "react", "node", "mongodb"]},
    ]
    drive_ids = []
    for d in drives:
        doc = {"id": str(uuid.uuid4()), **d, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.drives.insert_one(doc)
        drive_ids.append(doc["id"])

    # Sample applications
    statuses = ["applied", "shortlisted", "interviewed", "selected", "rejected"]
    for sid in student_ids[:3]:
        for di, did in enumerate(drive_ids[:4]):
            doc = {
                "id": str(uuid.uuid4()),
                "user_id": sid,
                "drive_id": did,
                "status": statuses[di % len(statuses)],
                "applied_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.applications.insert_one(doc)

    # Notifications
    notes = [
        {"title": "Welcome to PlacementPro", "message": "Complete your profile to get personalized recommendations.", "target_role": "student"},
        {"title": "Resume Workshop", "message": "Attend the resume building workshop on Friday at 4 PM.", "target_role": "student"},
        {"title": "Drive Schedule Released", "message": "February drive schedule has been published.", "target_role": None},
        {"title": "Department Report Ready", "message": "Q1 placement report for your department is ready.", "target_role": "hod"},
        {"title": "TPO Sync Meeting", "message": "Weekly sync with company partners scheduled.", "target_role": "tpo"},
    ]
    for n in notes:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            **n,
            "target_user_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "read_by": [],
        })
    logger.info("Seed complete.")


@api.get("/")
async def root():
    return {"name": "PlacementPro AI API", "status": "ok"}


@api.get("/health")
async def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    await seed_data()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
