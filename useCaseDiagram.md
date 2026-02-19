# Use Case Diagram

```mermaid
usecaseDiagram
  actor Admin
  actor Examiner
  actor Student

  usecase "Manage Users" as UC1
  usecase "Manage Courses" as UC2
  usecase "Create Questions" as UC3
  usecase "Create Exams" as UC4
  usecase "Grade Subjective" as UC5
  usecase "Enroll Course" as UC6
  usecase "Take Exam" as UC7
  usecase "View Results" as UC8

  Admin --> UC1
  Admin --> UC2
  
  Examiner --> UC3
  Examiner --> UC4
  Examiner --> UC5

  Student --> UC6
  Student --> UC7
  Student --> UC8
```
