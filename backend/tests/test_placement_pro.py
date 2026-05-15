"""PlacementPro AI - Comprehensive backend regression tests.

Covers: auth, profile, resume, skill-gap, placement prediction, interviews,
drives, applications, courses, notifications, analytics, students, RBAC,
and JWT handling.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://placement-pro-stable.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

STUDENT = ("student@demo.com", "password123")
HOD = ("hod@demo.com", "password123")
TPO = ("tpo@demo.com", "password123")


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"], r.json()["user"]


def _h(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def student_auth():
    return _login(*STUDENT)


@pytest.fixture(scope="session")
def hod_auth():
    return _login(*HOD)


@pytest.fixture(scope="session")
def tpo_auth():
    return _login(*TPO)


# ---------------- Health / Auth ----------------
class TestHealthAuth:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_login_student(self):
        token, user = _login(*STUDENT)
        assert user["role"] == "student"
        assert user["email"] == "student@demo.com"
        assert "password" not in user

    def test_login_hod(self):
        _, user = _login(*HOD)
        assert user["role"] == "hod"

    def test_login_tpo(self):
        _, user = _login(*TPO)
        assert user["role"] == "tpo"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "x@x.com", "password": "wrong"})
        assert r.status_code == 401

    def test_signup_and_login(self):
        email = f"test_{uuid.uuid4().hex[:8]}@demo.com"
        payload = {
            "name": "Test User", "email": email, "password": "password123",
            "role": "student", "department": "Computer Science",
            "roll_number": "TST001", "cgpa": 8.0, "year": "Final Year"
        }
        r = requests.post(f"{API}/auth/signup", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and data["user"]["email"] == email

        # duplicate
        r2 = requests.post(f"{API}/auth/signup", json=payload)
        assert r2.status_code == 400

    def test_signup_invalid_role(self):
        r = requests.post(f"{API}/auth/signup", json={
            "name": "X", "email": f"TEST_{uuid.uuid4().hex[:6]}@d.com",
            "password": "password123", "role": "admin"
        })
        assert r.status_code == 400

    def test_me_with_token(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/auth/me", headers=_h(token))
        assert r.status_code == 200
        assert r.json()["email"] == "student@demo.com"

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)

    def test_me_invalid_token(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code == 401


# ---------------- Profile ----------------
class TestProfile:
    def test_update_profile(self, student_auth):
        token, _ = student_auth
        r = requests.put(f"{API}/profile", json={
            "phone": "9999988888", "bio": "Test bio", "skills": ["python", "react", "sql"]
        }, headers=_h(token))
        assert r.status_code == 200
        data = r.json()
        assert data["phone"] == "9999988888"
        assert "python" in data["skills"]

        # verify via /me
        r2 = requests.get(f"{API}/auth/me", headers=_h(token))
        assert r2.json()["phone"] == "9999988888"


# ---------------- Resume ----------------
class TestResume:
    RESUME_TEXT = ("Aarav Sharma. Experience as intern at Google. "
                   "Projects: built React app with Node and MongoDB. Skills: python, java, sql, react, "
                   "javascript, docker, aws, git, data structures, algorithms. github.com/user. "
                   "Achievement: hackathon winner. " * 10)

    def test_upload_resume_student(self, student_auth):
        token, _ = student_auth
        r = requests.post(f"{API}/resume/upload", json={
            "filename": "resume.pdf", "content": "", "text": self.RESUME_TEXT
        }, headers=_h(token))
        assert r.status_code == 200, r.text
        assert "id" in r.json()

    def test_upload_resume_forbidden_tpo(self, tpo_auth):
        token, _ = tpo_auth
        r = requests.post(f"{API}/resume/upload", json={
            "filename": "r.pdf", "content": "", "text": "x"
        }, headers=_h(token))
        assert r.status_code == 403

    def test_get_resume(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/resume", headers=_h(token))
        assert r.status_code == 200
        assert r.json()["filename"] == "resume.pdf"

    def test_analyze_resume(self, student_auth):
        token, _ = student_auth
        r = requests.post(f"{API}/resume/analyze", headers=_h(token))
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("ats_score", "quality_score", "skills", "strengths", "weaknesses", "suggestions"):
            assert k in d
        assert isinstance(d["skills"], list) and len(d["skills"]) > 0
        assert 0 <= d["ats_score"] <= 100


# ---------------- Skill Gap ----------------
class TestSkillGap:
    def test_skill_gap(self, student_auth):
        token, _ = student_auth
        r = requests.post(f"{API}/skill-gap", json={
            "target_role": "Software Engineer", "current_skills": ["python", "sql"]
        }, headers=_h(token))
        assert r.status_code == 200
        d = r.json()
        assert d["target_role"] == "Software Engineer"
        assert isinstance(d["match_percentage"], int)
        assert isinstance(d["matched_skills"], list)
        assert isinstance(d["missing_skills"], list)
        assert isinstance(d["course_recommendations"], list)
        for c in d["course_recommendations"]:
            assert c.get("url", "").startswith("http")

    def test_skill_gap_roles(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/skill-gap/roles", headers=_h(token))
        assert r.status_code == 200
        roles = r.json()
        assert "Software Engineer" in roles

    def test_skill_gap_overview_hod(self, hod_auth):
        token, _ = hod_auth
        r = requests.get(f"{API}/skill-gap/overview", headers=_h(token))
        assert r.status_code == 200
        d = r.json()
        for k in ("student_count", "top_skills", "most_missing_skills", "target_role"):
            assert k in d

    def test_skill_gap_overview_forbidden(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/skill-gap/overview", headers=_h(token))
        assert r.status_code == 403


# ---------------- Placement Prediction ----------------
class TestPlacementPrediction:
    def test_prediction(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/placement-prediction", headers=_h(token))
        assert r.status_code == 200
        d = r.json()
        assert "placement_probability" in d
        assert "readiness_level" in d
        assert isinstance(d["improvement_areas"], list)
        assert 0 <= d["placement_probability"] <= 100


# ---------------- Interview ----------------
class TestInterview:
    def test_interview_flow(self, student_auth):
        token, _ = student_auth
        r = requests.post(f"{API}/interview/start", json={
            "role": "Software Engineer", "difficulty": "easy"
        }, headers=_h(token))
        assert r.status_code == 200, r.text
        s = r.json()
        assert "session_id" in s
        assert isinstance(s["questions"], list) and len(s["questions"]) > 0

        # Submit answers
        answers = ["I am a final year student with experience in Python, React, and building full-stack projects. " * 3
                   for _ in s["questions"]]
        r2 = requests.post(f"{API}/interview/submit", json={
            "session_id": s["session_id"], "answers": answers
        }, headers=_h(token))
        assert r2.status_code == 200, r2.text
        sub = r2.json()
        assert "average_score" in sub and "overall" in sub
        assert isinstance(sub["results"], list)
        assert all("score" in res and "feedback" in res for res in sub["results"])

    def test_interview_history(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/interview/history", headers=_h(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------------- Drives ----------------
class TestDrives:
    drive_id = None

    def test_list_drives_as_student(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/drives", headers=_h(token))
        assert r.status_code == 200
        drives = r.json()
        assert isinstance(drives, list) and len(drives) > 0
        assert all("applied" in d for d in drives)

    def test_create_drive_tpo(self, tpo_auth):
        token, _ = tpo_auth
        r = requests.post(f"{API}/drives", json={
            "company": f"TEST_Co_{uuid.uuid4().hex[:6]}", "role": "SDE",
            "package_lpa": 15.0, "location": "Remote", "eligibility_cgpa": 7.0,
            "eligible_branches": ["Computer Science"], "drive_date": "2026-06-01",
            "description": "Test drive", "skills_required": ["python"]
        }, headers=_h(token))
        assert r.status_code == 200, r.text
        TestDrives.drive_id = r.json()["id"]

    def test_create_drive_forbidden(self, student_auth):
        token, _ = student_auth
        r = requests.post(f"{API}/drives", json={
            "company": "X", "role": "X", "package_lpa": 1.0, "location": "X",
            "eligibility_cgpa": 6.0, "eligible_branches": ["X"],
            "drive_date": "2026-06-01", "description": "x"
        }, headers=_h(token))
        assert r.status_code == 403

    def test_update_drive(self, tpo_auth):
        assert TestDrives.drive_id
        token, _ = tpo_auth
        r = requests.put(f"{API}/drives/{TestDrives.drive_id}", json={
            "company": "TEST_Updated", "role": "SDE-2", "package_lpa": 20.0,
            "location": "Remote", "eligibility_cgpa": 7.5,
            "eligible_branches": ["Computer Science"], "drive_date": "2026-06-15",
            "description": "Updated", "skills_required": ["python", "go"]
        }, headers=_h(token))
        assert r.status_code == 200

    def test_delete_drive(self, tpo_auth):
        assert TestDrives.drive_id
        token, _ = tpo_auth
        r = requests.delete(f"{API}/drives/{TestDrives.drive_id}", headers=_h(token))
        assert r.status_code == 200


# ---------------- Applications ----------------
class TestApplications:
    new_app_drive_id = None
    new_app_id = None

    def test_apply_and_duplicate(self, student_auth, tpo_auth):
        # Create a fresh drive as TPO so student hasn't applied
        ttoken, _ = tpo_auth
        cr = requests.post(f"{API}/drives", json={
            "company": f"TEST_App_{uuid.uuid4().hex[:6]}", "role": "SDE",
            "package_lpa": 12.0, "location": "Pune", "eligibility_cgpa": 6.5,
            "eligible_branches": ["Computer Science"], "drive_date": "2026-07-01",
            "description": "App test", "skills_required": []
        }, headers=_h(ttoken))
        assert cr.status_code == 200
        TestApplications.new_app_drive_id = cr.json()["id"]

        stoken, _ = student_auth
        r = requests.post(f"{API}/applications", json={
            "drive_id": TestApplications.new_app_drive_id
        }, headers=_h(stoken))
        assert r.status_code == 200, r.text
        TestApplications.new_app_id = r.json()["id"]
        assert r.json()["status"] == "applied"

        # Duplicate
        r2 = requests.post(f"{API}/applications", json={
            "drive_id": TestApplications.new_app_drive_id
        }, headers=_h(stoken))
        assert r2.status_code == 400

    def test_apply_drive_not_found(self, student_auth):
        token, _ = student_auth
        r = requests.post(f"{API}/applications", json={"drive_id": "nope-123"}, headers=_h(token))
        assert r.status_code == 404

    def test_list_applications_student(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/applications", headers=_h(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_applications_tpo_enriched(self, tpo_auth):
        token, _ = tpo_auth
        r = requests.get(f"{API}/applications", headers=_h(token))
        assert r.status_code == 200
        apps = r.json()
        assert isinstance(apps, list)
        if apps:
            assert any("student" in a and "drive" in a for a in apps)

    def test_update_status(self, tpo_auth):
        assert TestApplications.new_app_id
        token, _ = tpo_auth
        r = requests.put(f"{API}/applications/status", json={
            "application_id": TestApplications.new_app_id, "status": "shortlisted"
        }, headers=_h(token))
        assert r.status_code == 200

    def test_update_status_invalid(self, tpo_auth):
        token, _ = tpo_auth
        r = requests.put(f"{API}/applications/status", json={
            "application_id": "anything", "status": "weird"
        }, headers=_h(token))
        assert r.status_code == 400


# ---------------- Courses ----------------
class TestCourses:
    def test_courses_recommend(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/courses/recommend", headers=_h(token))
        assert r.status_code == 200
        d = r.json()
        assert "courses" in d
        for c in d["courses"]:
            assert c.get("url", "").startswith("http")

    def test_courses_list(self):
        r = requests.get(f"{API}/courses")
        assert r.status_code == 200
        cs = r.json()
        assert isinstance(cs, list) and len(cs) > 0
        assert all(c["url"].startswith("http") for c in cs)


# ---------------- Notifications ----------------
class TestNotifications:
    note_id = None

    def test_list_notifications(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/notifications", headers=_h(token))
        assert r.status_code == 200
        notes = r.json()
        assert isinstance(notes, list)
        for n in notes:
            assert "read" in n

    def test_create_notification_tpo(self, tpo_auth):
        token, _ = tpo_auth
        r = requests.post(f"{API}/notifications", json={
            "title": "TEST_Note", "message": "Hello", "target_role": "student"
        }, headers=_h(token))
        assert r.status_code == 200
        TestNotifications.note_id = r.json()["id"]

    def test_create_notification_forbidden(self, student_auth):
        token, _ = student_auth
        r = requests.post(f"{API}/notifications", json={
            "title": "x", "message": "y"
        }, headers=_h(token))
        assert r.status_code == 403

    def test_mark_read(self, student_auth):
        assert TestNotifications.note_id
        token, _ = student_auth
        r = requests.post(f"{API}/notifications/{TestNotifications.note_id}/read", headers=_h(token))
        assert r.status_code == 200


# ---------------- Analytics ----------------
class TestAnalytics:
    def test_hod_analytics(self, hod_auth):
        token, _ = hod_auth
        r = requests.get(f"{API}/analytics/hod", headers=_h(token))
        assert r.status_code == 200
        d = r.json()
        for k in ("department", "total_students", "applications_by_status",
                  "placements_by_company", "top_performers"):
            assert k in d

    def test_hod_analytics_forbidden(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/analytics/hod", headers=_h(token))
        assert r.status_code == 403

    def test_tpo_analytics(self, tpo_auth):
        token, _ = tpo_auth
        r = requests.get(f"{API}/analytics/tpo", headers=_h(token))
        assert r.status_code == 200
        d = r.json()
        for k in ("total_students", "by_department", "by_company", "by_status", "average_package_lpa"):
            assert k in d

    def test_tpo_analytics_forbidden(self, hod_auth):
        token, _ = hod_auth
        r = requests.get(f"{API}/analytics/tpo", headers=_h(token))
        assert r.status_code == 403


# ---------------- Students / Resumes Dept ----------------
class TestStudentsListing:
    def test_students_tpo(self, tpo_auth):
        token, _ = tpo_auth
        r = requests.get(f"{API}/students", headers=_h(token))
        assert r.status_code == 200
        ss = r.json()
        assert isinstance(ss, list) and len(ss) > 0
        assert all("applications_count" in s for s in ss)

    def test_students_hod_only_dept(self, hod_auth):
        token, user = hod_auth
        r = requests.get(f"{API}/students", headers=_h(token))
        assert r.status_code == 200
        ss = r.json()
        assert all(s.get("department") == user["department"] for s in ss)

    def test_students_forbidden_student(self, student_auth):
        token, _ = student_auth
        r = requests.get(f"{API}/students", headers=_h(token))
        assert r.status_code == 403

    def test_dept_resumes_hod(self, hod_auth):
        token, _ = hod_auth
        r = requests.get(f"{API}/resumes/department", headers=_h(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_dept_resumes_forbidden(self, tpo_auth):
        token, _ = tpo_auth
        r = requests.get(f"{API}/resumes/department", headers=_h(token))
        assert r.status_code == 403
