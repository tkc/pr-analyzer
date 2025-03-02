/**
 * Statistics about code changes in a Git diff
 */
export interface GitDiffStat {
	addedLines: number
	deletedLines: number
	totalLines: number
}

/**
 * Common GitHub user object structure
 */
export interface GitHubUser {
	login: string
	id: number
	node_id: string
	avatar_url: string
	gravatar_id: string
	url: string
	html_url: string
	followers_url: string
	following_url: string
	gists_url: string
	starred_url: string
	subscriptions_url: string
	organizations_url: string
	repos_url: string
	events_url: string
	received_events_url: string
	type: string
	site_admin: boolean
}

/**
 * Common GitHub repository owner object
 */
export interface RepoOwner extends GitHubUser {}

/**
 * Common GitHub label object
 */
export interface GitHubLabel {
	id: number
	node_id: string
	url: string
	name: string
	color: string
	default: boolean
	description: string
}

/**
 * Common GitHub repository object
 */
export interface GitHubRepo {
	id: number
	node_id: string
	name: string
	full_name: string
	private: boolean
	owner: RepoOwner
	html_url: string
	description: string | null
	fork: boolean
	url: string
	forks_url: string
	keys_url: string
	collaborators_url: string
	teams_url: string
	hooks_url: string
	issue_events_url: string
	events_url: string
	assignees_url: string
	branches_url: string
	tags_url: string
	blobs_url: string
	git_commits_url: string
	git_tags_url: string
	trees_url: string
	statuses_url: string
	languages_url: string
	stargazers_url: string
	contributors_url: string
	subscribers_url: string
	subscription_url: string
	commits_url: string
	git_refs_url: string
	git_trees_url: string
	comments_url: string
	issue_comment_url: string
	contents_url: string
	compare_url: string
	merges_url: string
	archive_url: string
	downloads_url: string
	issues_url: string
	pulls_url: string
	milestones_url: string
	notifications_url: string
	labels_url: string
	releases_url: string
	deployments_url: string
	created_at: string
	updated_at: string
	pushed_at: string
	git_url: string
	ssh_url: string
	clone_url: string
	svn_url: string
	homepage: string | null
	size: number
	stargazers_count: number
	watchers_count: number
	language: string | null
	has_issues: boolean
	has_projects: boolean
	has_downloads: boolean
	has_wiki: boolean
	has_pages: boolean
	has_discussions: boolean
	forks_count: number
	mirror_url: string | null
	archived: boolean
	disabled: boolean
	open_issues_count: number
	license: string | null
	allow_forking: boolean
	is_template: boolean
	web_commit_signoff_required: boolean
	topics: string[]
	visibility: string
	forks: number
	open_issues: number
	watchers: number
	default_branch: string
}

/**
 * GitHub pull request ref structure (head/base)
 */
export interface PullRequestRef {
	label: string
	ref: string
	sha: string
	user: GitHubUser
	repo: GitHubRepo
}

/**
 * Common links structure for pull requests
 */
export interface PullRequestLinks {
	self: { href: string }
	html: { href: string }
	issue: { href: string }
	comments: { href: string }
	review_comments: { href: string }
	review_comment: { href: string }
	commits: { href: string }
	statuses: { href: string }
}

/**
 * API response model for GitHub pull requests
 */
export interface PullRequestResponse {
	url: string
	id: number
	node_id: string
	html_url: string
	diff_url: string
	patch_url: string
	issue_url: string
	number: number
	state: string
	locked: boolean
	title: string
	user: GitHubUser
	body: string | null
	created_at: string
	updated_at: string
	closed_at: string | null
	merged_at: string | null
	merge_commit_sha: string | null
	assignee: GitHubUser | null
	assignees: GitHubUser[]
	requested_reviewers: GitHubUser[]
	requested_teams: { id: number; name: string; slug: string }[]
	labels: GitHubLabel[]
	milestone: string | null
	draft: boolean
	commits_url: string
	review_comments_url: string
	review_comment_url: string
	comments_url: string
	statuses_url: string
	head: PullRequestRef
	base: PullRequestRef
	_links: PullRequestLinks
	author_association: string
	auto_merge: string | null
	active_lock_reason: string | null
}

/**
 * Domain model for pull requests with diff statistics
 */
export type PullRequestModel = Pick<
	PullRequestResponse,
	"id" | "number" | "title" | "created_at" | "merged_at" | "user" | "html_url"
> & {
	diff: GitDiffStat | null
	processed: boolean
	owner: string
	repo: string
}
