# 📝 Online Examination & Assessment Platform

## 1. Problem Statement

Traditional examination systems face issues like manual paper creation, inconsistent grading, exam security concerns, and lack of analytics. This platform provides a **centralized online examination system** that handles the complete exam lifecycle — from question creation to result generation.

---

## 2. Target Users

| Actor | Role |
|---|---|
| **Admin** | Manages users, courses, and system settings |
| **Examiner** | Creates questions, designs exams, and grades subjective answers |
| **Student** | Takes exams and views results |

---

## 3. Core Features

### 3.1 Authentication & Authorization
- JWT-based login with role-based access (Admin, Examiner, Student)
- Password hashing with bcrypt

### 3.2 User & Course Management
- Admin creates/manages users and courses
- Examiner assigned to courses; Students enroll in courses

### 3.3 Question Bank
- Question types: **MCQ**, **True/False**, **Subjective**
- Categorized by course, topic, and difficulty (Easy, Medium, Hard)

### 3.4 Exam Creation
- Examiner selects questions from bank to create exam
- Configure: duration, total marks, passing percentage, randomization
- Exam lifecycle: `DRAFT → PUBLISHED → ACTIVE → CLOSED`

### 3.5 Exam Session
- Timed exam with auto-submit on timeout
- Answer auto-save every 30 seconds
- One session per student per exam

### 3.6 Grading
- Auto-grading for MCQ and True/False
- Manual grading for subjective questions

### 3.7 Results
- Individual result with score, percentage, and pass/fail status

---

## 4. Design Patterns Used

| Pattern | Where |
|---|---|
| **Factory Pattern** | QuestionFactory creates MCQ/Subjective/TrueFalse question objects |
| **State Pattern** | Exam session state transitions: NOT_STARTED → IN_PROGRESS → SUBMITTED → GRADED |

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js |
| Frontend | React.js |
| Database | MongoDB |
| ODM | Mongoose |
| Auth | JWT + bcrypt |
| API Docs | Swagger / OpenAPI |

---

## 6. Architecture

### Layered Architecture

```
Client (React) → Routes/Controllers → Service Layer → Repository Layer → Database (MongoDB)
```

### OOP Principles

| Principle | Where |
|---|---|
| **Encapsulation** | Private fields with getters/setters |
| **Abstraction** | Service interfaces hide implementation |
| **Inheritance** | User ← Admin, Examiner, Student; Question ← MCQ, Subjective, TrueFalse |
| **Polymorphism** | Question.validateAnswer() behaves differently per question type |
