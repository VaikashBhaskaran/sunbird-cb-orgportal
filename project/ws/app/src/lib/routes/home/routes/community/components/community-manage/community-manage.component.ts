import { Component } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { CommunityService } from '../../services/community.service'
import { ReportIssueComponent } from '../report-issue/report-issue.component'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DialogConfirmComponent } from '../../../../../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'
import { map } from 'rxjs/operators'
import { Observable } from 'rxjs'

export interface IDialogData {
  title: {
    percentage: number
    count: number
  }
}

@Component({
    selector: 'ws-app-community-manage',
    templateUrl: './community-manage.component.html',
    styleUrls: ['./community-manage.component.scss'],
    standalone: false
})
export class CommunityManageComponent {
  selectedTabIndex = 0
  pageNumber = 0
  communityId: any
  allDisussionObj: any
  allDisussionObjCount: number = 0
  hiddenDisussionObj: any
  // allDisussionObjCount: Observable<number>
  // hiddenDisussionObj: any

  hiddenDisussionObjCount: number = 0
  getReportedIssuesObj: IDialogData[] = []
  viewMoreLength = 410
  getAllItems: any
  getAllItemsCount: number = 0
  getPostItems: any
  getPostItemsCount: number = 0
  getCommentItems: any
  getCommentItemsCount: number = 0
  getReplyItems: any
  getReplyItemsCount: number = 0
  activeFilter: string = 'all'
  totalDiscussionsCount: number = 0
  widgetData: any
  visibleCardCount = 5

  // private reportedDiscussionSubject = new BehaviorSubject<any[]>([]);
  // reportedDiscussion$ = this.reportedDiscussionSubject.asObservable();


  constructor(private dialog: MatDialog,
    private communitySvc: CommunityService,
    private actvRoute: ActivatedRoute,
    private snackbar: MatSnackBar,
    private router: Router,
    // private cdRef: ChangeDetectorRef,
  ) {
    this.actvRoute?.params?.subscribe((params: any) => {
      if (params) {
        this.communityId = params['communityId']
        // this.communityId = '1d08a92b-07fa-41e4-8060-93a221d416e6'
      }

    })
  }

  currentStatus = 'active'
  tabs = [
    {
      label: 'Pending',
      status: 'pending',
      icon: '' // Optional: Add Material icons
    },
    {
      label: 'Hidden',
      status: 'hidden',
      icon: ''
    }
  ]

  ngOnInit(): void {
    this.getReportedDiscussionItems()
    this.getHiddenDiscussionItems()
    this.getPostFilterItems()
    this.getCommentFilterItems()
    this.getReplyFilterItems()
  }

  onTabChange(event: any) {
    this.selectedTabIndex = event.index
    this.currentStatus = this.tabs[event.index].status
    this.pageNumber = 0 // Reset to first page on tab change
  }

  showMoreCards() {
    this.visibleCardCount += 5
  }

  openReportDialog(discussionId: any): void {
    this.getReportedIssueList(discussionId).subscribe((reportedIssues: any) => {
      if (reportedIssues) {
        const dialogRef = this.dialog.open(ReportIssueComponent, {
          width: '550px',
          panelClass: 'report-dialog-box',
          data: reportedIssues  // Pass actual fetched data
        })

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.getReportedIssueList(discussionId).subscribe()  // Refresh the data
            // this.snackbar.open('Reported issues updated successfully!', 'Close', { duration: 3000 })
          }
        })
      }
    })
  }


  openDialog(value: any, discussionId: any, itemType: any) {
    let discussId = discussionId
    let type = itemType
    if (value && value === "showPlatform") {
      const confirmDialog = this.dialog.open(DialogConfirmComponent, {
        width: '500px',
        data: {
          title: '',
          // tslint:disable-next-line
          body: `Are you sure you want to show this on the platform?`,
          ok: 'OK',
          cancel: 'Cancel',
          componentType: 'manageCommunity'
        },
        disableClose: true,
        autoFocus: false
      })
      confirmDialog.afterClosed().subscribe((response: any) => {
        if (response) {
          this.showOnPlatform(discussId, type)
        }
      })
    }

    if (value && value === "hideContent") {
      const confirmDialog = this.dialog.open(DialogConfirmComponent, {
        width: '500px',
        data: {
          title: '',
          body: `Are you sure you want to keep this hidden from the platform?`,
          ok: 'OK',
          cancel: 'Cancel',
          componentType: 'manageCommunity'
        },
        disableClose: true,
        autoFocus: false,
      })
      confirmDialog.afterClosed().subscribe((response: any) => {
        if (response) {
          this.hideContent(discussId, type)
        }
      })
    }
  }

  viewMoreOrLess(item: any) {
    if (this.getEditorTextLength(item.description) > this.viewMoreLength) {
      item.expanded = !item.expanded
    }
  }

  getEditorTextLength(content: any) {
    let test = content.trim()
    test = test.replace(/<[^>]*>/g, '')
    test = test.replace(/&nbsp;/gi, ' ')
    test = test.replace(/\s+/g, ' ')
    test = test.trim()
    return test.length
  }

  navigateBack() {
    this.router.navigate([`/app/home/community`])
  }


  //  GET ALL REPORTED ITEMS
  getReportedDiscussionItems() {
    const requestBody = {
      "filterCriteriaMap": {
        "status": [
          "reported"
        ],
        "communityId": this.communityId,
        "type": ["question", "answerPost", "answerPostReply"]
      },
      "requestedFields": [],
      "pageNumber": 0,
      "pageSize": 10,
      "orderBy": "recentReportedOn",
      "orderDirection": "DESC",
      "facets": ["type"]
    }
    this.communitySvc.getAllReportedDiscussion(requestBody).subscribe((res: any) => {
      if (res && res.result && res.result.search_results && res.result.search_results.data && res.result.search_results.data.length &&
        res.result.search_results.data.length > 0) {
        this.allDisussionObj = res.result.search_results.data
        // this.allDisussionObj = [...res.result.search_results.data];
        this.allDisussionObjCount = res.result.search_results.totalCount
      } else {
        this.allDisussionObj = []
        this.allDisussionObjCount = 0
      }
    })
  }

  getPostFilterItems() {
    const requestBody = {
      "filterCriteriaMap": {
        "status": [
          "reported"
        ],
        "communityId": this.communityId,
        "type": ["question"]
      },
      "requestedFields": [],
      "pageNumber": 0,
      "pageSize": 10,
      "orderBy": "recentReportedOn",
      "orderDirection": "DESC",
      "facets": ["type"]
    }
    this.communitySvc.getAllReportedDiscussion(requestBody).subscribe((res: any) => {
      if (res && res.result && res.result.search_results && res.result.search_results.data &&
        res.result.search_results.data.length && res.result.search_results.data.length > 0) {
        this.getPostItems = res.result.search_results.data
        this.getPostItemsCount = res.result.search_results.totalCount
      } else {
        this.getPostItems = []
        this.getPostItemsCount = 0
      }
    })
  }

  //  get comment filter items
  getCommentFilterItems() {
    const requestBody = {
      "filterCriteriaMap": {
        "status": [
          "reported"
        ],
        "communityId": this.communityId,
        "type": ["answerPost"]
      },
      "requestedFields": [],
      "pageNumber": 0,
      "pageSize": 10,
      "orderBy": "recentReportedOn",
      "orderDirection": "DESC",
      "facets": ["type"]
    }
    this.communitySvc.getAllReportedDiscussion(requestBody).subscribe((res: any) => {
      if (res && res.result && res.result.search_results && res.result.search_results.data &&
        res.result.search_results.data.length && res.result.search_results.data.length > 0) {
        this.getCommentItems = res.result.search_results.data
        this.getCommentItemsCount = res.result.search_results.totalCount
      } else {
        this.getCommentItems = []
        this.getCommentItemsCount = 0
      }
    })

  }

  // get reply filter items
  getReplyFilterItems() {
    const requestBody = {
      "filterCriteriaMap": {
        "status": [
          "reported"
        ],
        "communityId": this.communityId,
        "type": ["answerPostReply"]
      },
      "requestedFields": [],
      "pageNumber": 0,
      "pageSize": 10,
      "orderBy": "recentReportedOn",
      "orderDirection": "DESC",
      "facets": ["type"]
    }
    this.communitySvc.getAllReportedDiscussion(requestBody).subscribe((res: any) => {
      if (res && res.result && res.result.search_results && res.result.search_results.data &&
        res.result.search_results.data.length && res.result.search_results.data.length > 0) {
        this.getReplyItems = res.result.search_results.data
        this.getReplyItemsCount = res.result.search_results.totalCount
      } else {
        this.getReplyItems = []
        this.getReplyItemsCount = 0
      }
    })
  }


  // GET ALL HIDDEN ITEMS
  getHiddenDiscussionItems() {
    const requestBody = {
      "filterCriteriaMap": {
        "type": ["question", "answerPost", "answerPostReply"],
        "status": ["suspended"],
        "communityId": this.communityId,
      },
      "requestedFields": [],
      "pageNumber": 0,
      "pageSize": 10,
      "orderBy": "recentReportedOn",
      "orderDirection": "DESC",
      "facets": ["type"]
    }
    this.communitySvc.getHiddenDiscussions(requestBody).subscribe((res: any) => {
      if (res && res.result && res.result.search_results && res.result.search_results.data && res.result.search_results.data.length
        && res.result.search_results.data.length > 0) {
        this.hiddenDisussionObj = res.result.search_results.data
        this.hiddenDisussionObjCount = res.result.search_results.totalCount
      } else {
        this.hiddenDisussionObj = []
        this.hiddenDisussionObjCount = 0
      }
    })
  }

  showOnPlatform(discussionId: any, type: any): void {
    const requestBody = {
      "discussionId": discussionId,
      "type": type
    }
    this.communitySvc.displayReportedPost(requestBody).subscribe({
      next: (res: any) => {
        if (res) {
          this.snackbar.open('Post has been published on platform successfully!', 'Close', { duration: 3000 })
          this.getReportedDiscussionItems()
          this.getHiddenDiscussionItems()
          this.getPostFilterItems()
          this.getCommentFilterItems()
          this.getReplyFilterItems()
          // tslint:disable-next-line
          console.log(res, 'response====')
        }
      },
      error: (err: any) => {
        this.snackbar.open(err?.error?.message || 'Something went wrong!', 'Close', { duration: 3000 })
      },
    })
  }

  hideContent(discussionId: any, type: any) {
    const requestBody = {
      "discussionId": discussionId,
      "type": type
    }
    this.communitySvc.hideReportedPost(requestBody).subscribe({
      next: (res: any) => {
        if (res) {
          this.snackbar.open('Post has been hidden from platform successfully!', 'Close', { duration: 3000 })
          this.getReportedDiscussionItems()
          this.getHiddenDiscussionItems()
          this.getPostFilterItems()
          this.getCommentFilterItems()
          this.getReplyFilterItems()
          // tslint:disable-next-line
          console.log(res, 'response====')
        }
      },
      error: (err: any) => {
        this.snackbar.open(err?.error?.message || 'Something went wrong!', 'Close', { duration: 3000 })
      },
    })
  }

  getReportedIssueList(discussionId: any): Observable<any> {
    const requestBody = {
      "discussionId": discussionId,
      "type": "question"
    }
    return this.communitySvc.getReportedIssuesStats(requestBody).pipe(
      map((res: any) => {
        const reasons = res?.result?.reportReasons
        if (reasons) {
          // Convert object to array and sort by percentage in ascending order
          return Object.entries(reasons)
            .map(([key, value]: [string, any]) => ({
              reason: key,
              percentage: value.percentage,
              count: value.count
            }))
            .sort((a, b) => b.percentage - a.percentage)
        } else {
          return []
        }
      })
    )
  }





  filterItems(keyVal: any) {
    this.activeFilter = keyVal
    if (keyVal === 'all') {
      this.getReportedDiscussionItems()
    }
    if (keyVal === 'posts') {
      this.getPostFilterItems()
    }
    if (keyVal === 'comments') {
      this.getCommentFilterItems()
    }
    if (keyVal === 'reply') {
      this.getReplyFilterItems()
    }
  }

  openDocument(event: MouseEvent, url: string) {
    event.preventDefault()
    window.open(url, '_blank')
  }

  getFileExtension(filename: string): string {
    if (filename && filename !== 'undefined' && filename.includes('.') && !filename.endsWith('.')) {
      return filename.split('.').pop() || ''
    }
    return ''
  }

  getFileName(url: string): string {
    const filename = url.split('/').pop() || ''
    // Decode the URL-encoded filename
    return decodeURIComponent(filename)
  }

  getFileIcon(url: string): string {
    const extension = this.getFileExtension(url)
    switch (extension) {
      case 'pdf':
        return 'picture_as_pdf'
      case 'doc':
      case 'docx':
        return 'description'
      default:
        return 'insert_drive_file'
    }
  }

}
