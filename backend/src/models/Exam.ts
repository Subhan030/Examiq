type ExamState = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED';

export class ExamSession {
  private state: ExamState = 'DRAFT';
  public title: string;
  public totalMarks: number;

  constructor(title: string, totalMarks: number) {
    this.title = title;
    this.totalMarks = totalMarks;
  }

  publish() {
    if (this.state !== 'DRAFT') throw new Error('Can only publish DRAFT exams');
    this.state = 'PUBLISHED';
  }

  activate() {
    if (this.state !== 'PUBLISHED') throw new Error('Cannot activate an unpublished exam');
    this.state = 'ACTIVE';
  }

  close() {
    this.state = 'CLOSED';
  }

  getState() {
    return this.state;
  }
}
