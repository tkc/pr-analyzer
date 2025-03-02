import { expect } from '@jest/globals'
import { ResumeService, ProgressData } from "../src/service/resume"
import { FileSystem } from "../src/infrastructure/file/file_system"
import { PullRequestModel, GitDiffStat } from "../src/domain/model"

// Simple mock file system
class MockFileSystem implements FileSystem {
  private files: Record<string, string> = {}

  generateProgressFileName(date: string, owner: string, repo: string): string {
    return `${date}-${owner}-${repo}-progress.json`
  }

  async readProgress(fileName: string): Promise<ProgressData | null> {
    return this.files[fileName] ? JSON.parse(this.files[fileName]) : null
  }

  async saveProgress(progress: ProgressData, fileName: string): Promise<void> {
    this.files[fileName] = JSON.stringify(progress)
  }
}

describe('ResumeService', () => {
  let fileSystem: MockFileSystem
  let service: ResumeService
  const date = "2024-01-01"
  const owner = "owner1"
  const repo = "repo1"

  beforeEach(() => {
    fileSystem = new MockFileSystem()
    service = new ResumeService(fileSystem)
  })

  it('generates correct filename', () => {
    const fileName = fileSystem.generateProgressFileName(date, owner, repo)
    expect(fileName).toBe("2024-01-01-owner1-repo1-progress.json")
  })

  it('saves and loads progress', async () => {
    // Create simple test data
    const pullRequests: PullRequestModel[] = [{
      id: 1,
      number: 1,
      owner: 'owner1',
      repo: 'repo1',
      title: 'Test PR',
      created_at: '2024-01-01',
      merged_at: null,
      user: { id: 1, login: 'user1' } as any,
      html_url: 'https://github.com',
      processed: false,
      diff: null
    }]
    
    // Save progress
    await service.saveProgress({ pullRequests }, date, owner, repo)
    
    // Load progress
    const loaded = await service.loadProgress(date, owner, repo)
    expect(loaded).toEqual({ pullRequests })
  })

  it('initializes progress', async () => {
    const pullRequests: PullRequestModel[] = [{
      id: 1,
      number: 1,
      owner: 'owner1',
      repo: 'repo1',
      title: 'Test PR',
      created_at: '2024-01-01',
      merged_at: null,
      user: { id: 1, login: 'user1' } as any,
      html_url: 'https://github.com',
      processed: false,
      diff: null
    }]

    const result = await service.initProgress(pullRequests, date, owner, repo)
    expect(result).toEqual(pullRequests)
  })

  it('returns existing progress on init if available', async () => {
    // Initial data
    const original: PullRequestModel[] = [{
      id: 1,
      number: 1,
      owner: 'owner1',
      repo: 'repo1',
      title: 'Test PR',
      created_at: '2024-01-01',
      merged_at: null,
      user: { id: 1, login: 'user1' } as any,
      html_url: 'https://github.com',
      processed: false,
      diff: null
    }]

    // Save initial progress
    await service.initProgress(original, date, owner, repo)
    
    // Try init with new data
    const newData: PullRequestModel[] = [{
      id: 999,
      number: 999,
      owner: 'owner1',
      repo: 'repo1',
      title: 'New PR',
      created_at: '2024-01-02',
      merged_at: null,
      user: { id: 2, login: 'user2' } as any,
      html_url: 'https://github.com',
      processed: false,
      diff: null
    }]
    
    const result = await service.initProgress(newData, date, owner, repo)
    
    // Should return original data, not new data
    expect(result).toEqual(original)
  })

  it('updates pull request progress', async () => {
    // Test PRs
    const pullRequests: PullRequestModel[] = [
      {
        id: 1,
        number: 1,
        owner: owner,
        repo: repo,
        title: 'PR 1',
        created_at: '2024-01-01',
        merged_at: null,
        html_url: 'https://github.com',
        diff: { addedLines: 1, deletedLines: 0, totalLines: 1 },
        processed: false,
        user: { id: 1, login: 'user1' } as any
      },
      {
        id: 2,
        number: 2,
        owner: owner,
        repo: repo,
        title: 'PR 2',
        created_at: '2024-01-01',
        merged_at: null,
        html_url: 'https://github.com',
        diff: { addedLines: 1, deletedLines: 0, totalLines: 1 },
        processed: false,
        user: { id: 2, login: 'user2' } as any
      }
    ]
    
    // New diff data
    const newDiff: GitDiffStat = {
      addedLines: 10,
      deletedLines: 5,
      totalLines: 15
    }
    
    // Update PR #1
    const updated = await service.updateProgress({
      pullRequests,
      number: 1,
      owner,
      repo,
      diff: newDiff,
      processed: true
    })
    
    // Check PR #1 was updated
    expect(updated[0].diff).toEqual(newDiff)
    expect(updated[0].processed).toBe(true)
    
    // Check PR #2 was not updated
    expect(updated[1].id).toBe(2)
    expect(updated[1].diff).toEqual({ addedLines: 1, deletedLines: 0, totalLines: 1 })
    expect(updated[1].processed).toBe(false)
  })
})