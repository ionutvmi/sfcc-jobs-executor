import * as vscode from "vscode";

export interface SavedJob {
  id: string;
  timeout: number;
  clearLog: boolean;
  position: number;
}

export class JobsTreeViewProvider implements vscode.TreeDataProvider<JobItem> {
  public static readonly viewId = "sfcc-jobs-executor.jobsView";

  private _onDidChangeTreeData: vscode.EventEmitter<
    JobItem | undefined | void
  > = new vscode.EventEmitter<JobItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<JobItem | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor(private store: vscode.Memento) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: JobItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: JobItem): Thenable<JobItem[]> {
    const savedItems = this.store.get<SavedJob[]>("savedJobs");

    if (!savedItems) {
      return Promise.resolve([]);
    }

    let result: JobItem[] = [];

    result = savedItems
      .sort((a, b) => a.position - b.position)
      .map(
        (job) => new JobItem(job.id, job, vscode.TreeItemCollapsibleState.None)
      );

    return Promise.resolve(result);
  }

  async addNewJob(newJob: SavedJob) {
    let savedItems = this.store.get<SavedJob[]>("savedJobs");
    if (!savedItems) {
      savedItems = [];
    }

    const existingJobIndex = savedItems.findIndex(function (currentJob) {
      return currentJob.id === newJob.id;
    });

    if (existingJobIndex === -1) {
      savedItems.push({
        id: newJob.id,
        timeout: newJob.timeout,
        clearLog: newJob.clearLog,
        position: newJob.position,
      });
    } else {
      savedItems.splice(existingJobIndex, 1, {
        id: newJob.id,
        timeout: newJob.timeout,
        clearLog: newJob.clearLog,
        position: newJob.position,
      });
    }

    await this.store.update("savedJobs", savedItems);
    return true;
  }

  async removeJob(jobId: string) {
    let savedItems = this.store.get<SavedJob[]>("savedJobs");
    if (!savedItems) {
      return false;
    }

    savedItems = savedItems.filter((job) => job.id !== jobId);
    await this.store.update("savedJobs", savedItems);
    return true;
  }
}

export class JobItem extends vscode.TreeItem {
  constructor(
    public label: string,
    public job: SavedJob,
    public collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);

    this.tooltip = `id: ${job.id}
timeout: ${job.timeout}ms
clearLog: ${job.clearLog}
position: ${job.position}
`;
    this.description = `t:${job.timeout / 1000}s, c:${job.clearLog}, p:${
      job.position
    }`;
  }
}
