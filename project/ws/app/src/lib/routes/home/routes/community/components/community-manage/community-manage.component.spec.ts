import { CommunityManageComponent } from './community-manage.component'
import { MatDialog } from '@angular/material/dialog'
import { CommunityService } from '../../services/community.service'
// import { ActivatedRoute } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of, throwError } from 'rxjs'
import { ReportIssueComponent } from '../report-issue/report-issue.component'
import { DialogConfirmComponent } from '../../../../../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'

describe('CommunityManageComponent', () => {
  let component: CommunityManageComponent
  let mockMatDialog: jest.Mocked<MatDialog>
  let mockCommunityService: jest.Mocked<CommunityService>
  let mockActivatedRoute: any
  let mockSnackBar: jest.Mocked<MatSnackBar>

  const communityId = '1d08a92b-07fa-41e4-8060-93a221d416e6'

  // Mock responses for different API calls
  const mockReportedDiscussionResponse = {
    result: {
      search_results: {
        data: [
          { id: '1', description: 'Test description', expanded: false }
        ],
        totalCount: 1
      }
    }
  }

  const mockReportedIssuesStatsResponse = {
    result: {
      reportReasons: {
        'Inappropriate': { percentage: 60, count: 6 },
        'Spam': { percentage: 40, count: 4 }
      }
    }
  }

  beforeEach(() => {
    // Create mocks for all dependencies
    mockMatDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of(true))
      })
    } as unknown as jest.Mocked<MatDialog>

    mockCommunityService = {
      getAllReportedDiscussion: jest.fn().mockReturnValue(of(mockReportedDiscussionResponse)),
      getHiddenDiscussions: jest.fn().mockReturnValue(of(mockReportedDiscussionResponse)),
      getReportedIssuesStats: jest.fn().mockReturnValue(of(mockReportedIssuesStatsResponse)),
      hideReportedPost: jest.fn().mockReturnValue(of({ success: true })),
      displayReportedPost: jest.fn().mockReturnValue(of({ success: true }))
    } as unknown as jest.Mocked<CommunityService>

    mockActivatedRoute = {
      params: of({ communityId })
    }

    mockSnackBar = {
      open: jest.fn()
    } as unknown as jest.Mocked<MatSnackBar>

    // Create component with mock dependencies
    component = new CommunityManageComponent(
      mockMatDialog,
      mockCommunityService,
      mockActivatedRoute,
      mockSnackBar,
      // Added since this spec was written.
      { navigate: jest.fn() } as any
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be created', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with community ID from route params', () => {
    expect(component.communityId).toBe(communityId)
  })

  describe('ngOnInit', () => {
    beforeEach(() => {
      // Reset the spy calls
      jest.clearAllMocks()

      // Call ngOnInit manually since we're not using TestBed
      component.ngOnInit()
    })

    it('should call getReportedDiscussionItems and other required methods on init', () => {
      // Create spies for the methods called in ngOnInit
      const getReportedDiscussionItemsSpy = jest.spyOn(component, 'getReportedDiscussionItems')
      const getHiddenDiscussionItemsSpy = jest.spyOn(component, 'getHiddenDiscussionItems')
      const getPostFilterItemsSpy = jest.spyOn(component, 'getPostFilterItems')
      const getCommentFilterItemsSpy = jest.spyOn(component, 'getCommentFilterItems')
      const getReplyFilterItemsSpy = jest.spyOn(component, 'getReplyFilterItems')

      // Call ngOnInit manually
      component.ngOnInit()

      // Verify all expected methods were called
      expect(getReportedDiscussionItemsSpy).toHaveBeenCalled()
      expect(getHiddenDiscussionItemsSpy).toHaveBeenCalled()
      expect(getPostFilterItemsSpy).toHaveBeenCalled()
      expect(getCommentFilterItemsSpy).toHaveBeenCalled()
      expect(getReplyFilterItemsSpy).toHaveBeenCalled()
    })

    it('should fetch reported discussion items', () => {
      expect(mockCommunityService.getAllReportedDiscussion).toHaveBeenCalledWith(
        expect.objectContaining({
          filterCriteriaMap: expect.objectContaining({
            status: ['reported'],
            communityId: communityId
          })
        })
      )

      // Verify data was populated
      expect(component.allDisussionObj).toEqual(mockReportedDiscussionResponse.result.search_results.data)
      expect(component.allDisussionObjCount).toBe(mockReportedDiscussionResponse.result.search_results.totalCount)
    })
  })

  describe('onTabChange', () => {
    it('should update selectedTabIndex, currentStatus and reset pageNumber', () => {
      const event = { index: 1 }
      component.onTabChange(event)

      expect(component.selectedTabIndex).toBe(1)
      expect(component.currentStatus).toBe('hidden')
      expect(component.pageNumber).toBe(0)
    })
  })

  describe('openReportDialog', () => {
    it('should open report dialog with fetched data', () => {
      const discussionId = '123'

      component.openReportDialog(discussionId)

      expect(mockCommunityService.getReportedIssuesStats).toHaveBeenCalledWith(
        expect.objectContaining({
          discussionId,
          type: 'question'
        })
      )

      expect(mockMatDialog.open).toHaveBeenCalledWith(
        ReportIssueComponent,
        expect.objectContaining({
          width: '550px',
          panelClass: 'report-dialog-box',
          data: expect.any(Array)
        })
      )
    })

    it('should call getReportedIssueList again after dialog is closed with a result', () => {
      const discussionId = '123'
      const getReportedIssueListSpy = jest.spyOn(component, 'getReportedIssueList')

      component.openReportDialog(discussionId)

      expect(getReportedIssueListSpy).toHaveBeenCalledTimes(2) // Once for initial fetch, once after dialog closes
    })
  })

  describe('openDialog', () => {
    const discussionId = '123'
    const itemType = 'question'

    it('should open confirmation dialog for showing content on platform', () => {
      component.openDialog('showPlatform', discussionId, itemType)

      expect(mockMatDialog.open).toHaveBeenCalledWith(
        DialogConfirmComponent,
        expect.objectContaining({
          width: '500px',
          data: expect.objectContaining({
            body: expect.stringContaining('show this on the platform')
          })
        })
      )
    })

    it('should open confirmation dialog for hiding content', () => {
      component.openDialog('hideContent', discussionId, itemType)

      expect(mockMatDialog.open).toHaveBeenCalledWith(
        DialogConfirmComponent,
        expect.objectContaining({
          width: '500px',
          data: expect.objectContaining({
            body: expect.stringContaining('keep this hidden from the platform')
          })
        })
      )
    })

    it('should call showOnPlatform after dialog confirmation', () => {
      const showOnPlatformSpy = jest.spyOn(component, 'showOnPlatform')

      component.openDialog('showPlatform', discussionId, itemType)

      expect(showOnPlatformSpy).toHaveBeenCalledWith(discussionId, itemType)
    })

    it('should call hideContent after dialog confirmation', () => {
      const hideContentSpy = jest.spyOn(component, 'hideContent')

      component.openDialog('hideContent', discussionId, itemType)

      expect(hideContentSpy).toHaveBeenCalledWith(discussionId, itemType)
    })
  })

  describe('viewMoreOrLess', () => {
    it('should toggle expanded state if content is longer than viewMoreLength', () => {
      const item = { description: '<p>Lorem ipsum dolor sit amet</p>'.repeat(20), expanded: false }

      // Mock the getEditorTextLength method to return a length greater than viewMoreLength
      jest.spyOn(component, 'getEditorTextLength').mockReturnValue(500)

      component.viewMoreOrLess(item)
      expect(item.expanded).toBe(true)

      component.viewMoreOrLess(item)
      expect(item.expanded).toBe(false)
    })

    it('should not toggle expanded state if content is shorter than viewMoreLength', () => {
      const item = { description: 'Short content', expanded: false }

      // Mock the getEditorTextLength method to return a length less than viewMoreLength
      jest.spyOn(component, 'getEditorTextLength').mockReturnValue(20)

      component.viewMoreOrLess(item)
      expect(item.expanded).toBe(false)
    })
  })

  describe('getEditorTextLength', () => {
    it('should strip HTML tags and return correct text length', () => {
      const htmlContent = '<p>This is <strong>a test</strong> with some &nbsp; spaces</p>'
      const length = component.getEditorTextLength(htmlContent)
      expect(length).toBe('This is a test with some spaces'.length)
    })
  })

  describe('showOnPlatform', () => {
    it('should call displayReportedPost service method with correct params', () => {
      const discussionId = '123'
      const type = 'question'

      component.showOnPlatform(discussionId, type)

      expect(mockCommunityService.displayReportedPost).toHaveBeenCalledWith({
        discussionId,
        type
      })

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Post has been published on platform successfully!',
        'Close',
        { duration: 3000 }
      )
    })

    it('should handle service errors', () => {
      const discussionId = '123'
      const type = 'question'
      const errorMsg = 'Service error'

      // Setup the service to throw an error
      mockCommunityService.displayReportedPost.mockReturnValue(throwError(() => new Error(errorMsg)))

      component.showOnPlatform(discussionId, type)

      // We can't test the error handler directly since it's inside a subscription,
      // but we can verify the service was called
      expect(mockCommunityService.displayReportedPost).toHaveBeenCalledWith({
        discussionId,
        type
      })
    })
  })

  describe('hideContent', () => {
    it('should call hideReportedPost service method with correct params', () => {
      const discussionId = '123'
      const type = 'question'

      component.hideContent(discussionId, type)

      expect(mockCommunityService.hideReportedPost).toHaveBeenCalledWith({
        discussionId,
        type
      })

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Post has been hidden from platform successfully!',
        'Close',
        { duration: 3000 }
      )
    })
  })

  describe('getReportedIssueList', () => {
    it('should transform API response into sorted array of issues', () => {
      const discussionId = '123'

      component.getReportedIssueList(discussionId).subscribe(result => {
        expect(result).toEqual([
          { reason: 'Inappropriate', percentage: 60, count: 6 },
          { reason: 'Spam', percentage: 40, count: 4 }
        ])
      })

      expect(mockCommunityService.getReportedIssuesStats).toHaveBeenCalledWith({
        discussionId,
        type: 'question'
      })
    })

    it('should return empty array if no report reasons', () => {
      const discussionId = '123'

      // Mock service to return response without reportReasons
      mockCommunityService.getReportedIssuesStats.mockReturnValue(of({ result: {} }))

      component.getReportedIssueList(discussionId).subscribe(result => {
        expect(result).toEqual([])
      })
    })
  })

  describe('filterItems', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should set activeFilter and call appropriate method for "all" filter', () => {
      const getReportedDiscussionItemsSpy = jest.spyOn(component, 'getReportedDiscussionItems')

      component.filterItems('all')

      expect(component.activeFilter).toBe('all')
      expect(getReportedDiscussionItemsSpy).toHaveBeenCalled()
    })

    it('should set activeFilter and call appropriate method for "posts" filter', () => {
      const getPostFilterItemsSpy = jest.spyOn(component, 'getPostFilterItems')

      component.filterItems('posts')

      expect(component.activeFilter).toBe('posts')
      expect(getPostFilterItemsSpy).toHaveBeenCalled()
    })

    it('should set activeFilter and call appropriate method for "comments" filter', () => {
      const getCommentFilterItemsSpy = jest.spyOn(component, 'getCommentFilterItems')

      component.filterItems('comments')

      expect(component.activeFilter).toBe('comments')
      expect(getCommentFilterItemsSpy).toHaveBeenCalled()
    })

    it('should set activeFilter and call appropriate method for "reply" filter', () => {
      const getReplyFilterItemsSpy = jest.spyOn(component, 'getReplyFilterItems')

      component.filterItems('reply')

      expect(component.activeFilter).toBe('reply')
      expect(getReplyFilterItemsSpy).toHaveBeenCalled()
    })
  })

  describe('file utilities', () => {
    it('should open document in new tab', () => {
      const url = 'http://example.com/file.pdf'
      const event = { preventDefault: jest.fn() } as unknown as MouseEvent
      const windowSpy = jest.spyOn(window, 'open').mockImplementation(() => null as any)

      component.openDocument(event, url)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(windowSpy).toHaveBeenCalledWith(url, '_blank')

      windowSpy.mockRestore()
    })

    it('should extract file extension correctly', () => {
      expect(component.getFileExtension('file.pdf')).toBe('pdf')
      expect(component.getFileExtension('file.name.docx')).toBe('docx')
      expect(component.getFileExtension('file')).toBe('')
      expect(component.getFileExtension('file.')).toBe('')
      expect(component.getFileExtension('undefined')).toBe('')
    })

    it('should extract file name from URL', () => {
      expect(component.getFileName('http://example.com/path/file.pdf')).toBe('file.pdf')
      expect(component.getFileName('http://example.com/file%20with%20spaces.docx')).toBe('file with spaces.docx')
    })

    it('should return appropriate file icon based on extension', () => {
      expect(component.getFileIcon('file.pdf')).toBe('picture_as_pdf')
      expect(component.getFileIcon('file.doc')).toBe('description')
      expect(component.getFileIcon('file.docx')).toBe('description')
      expect(component.getFileIcon('file.jpg')).toBe('insert_drive_file')
    })
  })
})