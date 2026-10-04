import { UsersViewComponent } from './users-view.component'
import { of } from 'rxjs'
import { ReportsVideoComponent } from '../reports-video/reports-video.component'

describe('UsersViewComponent', () => {
  let component: UsersViewComponent
  let mockDialog: any
  let mockRouter: any
  let mockRoute: any
  let mockEvents: any
  let mockLoaderService: any
  let mockSanitizer: any
  let mockUsersService: any
  let mockApprService: any

  const mockConfigService = {
    userProfile: {
      userId: 'test-user-id'
    },
    unMappedUser: {
      profileDetails: {
        profileStatus: 'VERIFIED'
      },
      roles: ['MDO_ADMIN'],
      channel: 'test-channel',
      rootOrg: {
        rootOrgId: 'test-root-org-id'
      }
    }
  }

  beforeEach(() => {
    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of({}),
      }),
    }

    mockRouter = {
      navigate: jest.fn(),
    }

    mockRoute = {
      snapshot: {
        params: { tab: 'allusers' },
        parent: {
          data: {
            configService: mockConfigService
          }
        }
      },
      parent: {
        snapshot: {
          data: {
            configService: mockConfigService
          }
        }
      }
    }

    mockEvents = {
      raiseInteractTelemetry: jest.fn(),
      handleTabTelemetry: jest.fn(),
    }

    mockLoaderService = {
      changeLoad: {
        next: jest.fn(),
      },
    }

    mockSanitizer = {
      bypassSecurityTrustHtml: jest.fn(html => html),
    }

    mockUsersService = {
      getAllKongUsers: jest.fn().mockReturnValue(of({
        result: {
          response: {
            content: [
              {
                userId: 'test-user-id',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                profileDetails: {
                  personalDetails: {
                    primaryEmail: 'john.doe@example.com',
                    mobile: '1234567890'
                  },
                  profileStatus: 'VERIFIED',
                  professionalDetails: {
                    designation: 'Developer',
                    group: 'IT',
                    role: 'Frontend'
                  }
                }
              }
            ],
            count: 1
          }
        }
      })),
    }

    mockApprService = {
      getApprovalsList: jest.fn().mockReturnValue(of({
        result: {
          data: [
            { id: 'approval1', status: 'SEND_FOR_APPROVAL' }
          ]
        }
      })),
    }

    component = new UsersViewComponent(
      mockDialog as any,
      mockRoute as any,
      mockRouter as any,
      mockEvents as any,
      mockLoaderService as any,
      mockSanitizer as any,
      mockUsersService as any,
      mockApprService as any
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize component properties and call data fetching methods', () => {
      const getAllUsersSpy = jest.spyOn(component, 'getAllUsers')
      const getVUsersSpy = jest.spyOn(component, 'getVUsers')
      const getNVUsersSpy = jest.spyOn(component, 'getNVUsers')
      const getNMUsersSpy = jest.spyOn(component, 'getNMUsers')
      const fetchApprovalsSpy = jest.spyOn(component, 'fetchApprovals')

      component.ngOnInit()

      expect(component.currentFilter).toBe('allusers')
      expect(component.rootOrgId).toBe('test-root-org-id')
      expect(component.searchQuery).toBe('')
      expect(component.isMdoAdmin).toBe(true)

      expect(getAllUsersSpy).toHaveBeenCalledWith('')
      expect(getVUsersSpy).toHaveBeenCalledWith('')
      expect(getNVUsersSpy).toHaveBeenCalledWith('')
      expect(getNMUsersSpy).toHaveBeenCalledWith('')
      expect(fetchApprovalsSpy).toHaveBeenCalled()
      expect(component.reportsNoteList.length).toBe(4)
    })
  })

  describe('sanitizeHtml', () => {
    it('should call sanitizer.bypassSecurityTrustHtml with the provided HTML', () => {
      const html = '<div>Test HTML</div>'
      component.sanitizeHtml(html)
      expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(html)
    })
  })

  describe('openVideoPopup', () => {
    it('should open dialog with ReportsVideoComponent', () => {
      component.openVideoPopup()
      expect(mockDialog.open).toHaveBeenCalledWith(
        ReportsVideoComponent,
        expect.objectContaining({
          data: { videoLink: expect.any(String) },
          disableClose: true,
          width: '50%',
          height: '60%',
          panelClass: 'overflow-visable',
        })
      )
    })
  })

  describe('filter', () => {
    it('should update currentFilter and reset pagination before calling filterData', () => {
      const filterDataSpy = jest.spyOn(component, 'filterData')
      component.filter('verified')

      expect(component.currentFilter).toBe('verified')
      expect(component.pageIndex).toBe(0)
      expect(component.currentOffset).toBe(0)
      expect(component.limit).toBe(20)
      expect(component.searchQuery).toBe('')
      expect(filterDataSpy).toHaveBeenCalledWith('')
    })
  })

  describe('tabTelemetry', () => {
    it('should call events.handleTabTelemetry with correct parameters', () => {
      component.tabTelemetry('Test Label', 1)
      expect(mockEvents.handleTabTelemetry).toHaveBeenCalledWith(
        'user-tab',
        { label: 'Test Label', index: 1 }
      )
    })
  })

  describe('filterData', () => {
    beforeEach(() => {
      jest.spyOn(component, 'getAllUsers').mockImplementation(() => Promise.resolve())
      jest.spyOn(component, 'getVUsers').mockImplementation(() => Promise.resolve())
      jest.spyOn(component, 'getNVUsers').mockImplementation(() => Promise.resolve())
      jest.spyOn(component, 'getNMUsers').mockImplementation(() => Promise.resolve())
      jest.spyOn(component, 'fetchApprovals').mockImplementation(() => { })
    })

    it('should call getAllUsers when currentFilter is allusers', () => {
      component.currentFilter = 'allusers'
      component.filterData('query')
      expect(component.getAllUsers).toHaveBeenCalledWith('query')
    })

    it('should call getVUsers when currentFilter is verified', () => {
      component.currentFilter = 'verified'
      component.filterData('query')
      expect(component.getVUsers).toHaveBeenCalledWith('query')
    })

    it('should call getNVUsers and fetchApprovals when currentFilter is nonverified', () => {
      component.currentFilter = 'nonverified'
      component.filterData('query')
      expect(component.fetchApprovals).toHaveBeenCalled()
      expect(component.getNVUsers).toHaveBeenCalledWith('query')
    })

    it('should call getNMUsers when currentFilter is notmyuser', () => {
      component.currentFilter = 'notmyuser'
      component.filterData('query')
      expect(component.getNMUsers).toHaveBeenCalledWith('query')
    })
  })

  describe('showEditUser', () => {
    it('should return true when user is MDO_ADMIN and roles array is not empty', () => {
      component.isMdoAdmin = true
      const result = component.showEditUser(['USER_ROLE'])
      expect(result).toBe(true)
    })

    it('should return true when user is not MDO_ADMIN', () => {
      component.isMdoAdmin = false
      const result = component.showEditUser(['USER_ROLE'])
      expect(result).toBe(true)
    })
  })

  describe('data fetching methods', () => {
    // These call the fetchers directly rather than through ngOnInit, which is where the
    // component normally reads rootOrgId off the parent route's resolved config.
    beforeEach(() => {
      component.rootOrgId = 'test-root-org-id'
    })

    it('getAllUsers should call usersService.getAllKongUsers with correct params', async () => {
      await component.getAllUsers('')

      expect(mockUsersService.getAllKongUsers).toHaveBeenCalledWith(expect.objectContaining({
        request: expect.objectContaining({
          filters: expect.objectContaining({
            rootOrgId: 'test-root-org-id',
            'profileDetails.profileStatus': ['VERIFIED', 'NOT-VERIFIED'],
            status: 1
          }),
          limit: 20,
          offset: 0
        })
      }))

      expect(component.activeUsersData).toBeDefined()
      expect(component.activeUsersDataCount).toBeDefined()
    })

    it('getVUsers should call usersService.getAllKongUsers with correct params', async () => {
      await component.getVUsers('')

      expect(mockUsersService.getAllKongUsers).toHaveBeenCalledWith(expect.objectContaining({
        request: expect.objectContaining({
          filters: expect.objectContaining({
            rootOrgId: 'test-root-org-id',
            'profileDetails.profileStatus': 'VERIFIED',
            status: 1
          }),
          limit: 20,
          offset: 0
        })
      }))

      expect(component.verifiedUsersData).toBeDefined()
      expect(component.verifiedUsersDataCount).toBeDefined()
    })
  })

  describe('filter helper methods', () => {
    it('getFilterGroup should return group value from query', () => {
      const query = { filters: { group: ['IT'] } }
      expect(component.getFilterGroup(query)).toEqual(['IT'])
    })

    it('getFilterDesignation should return designation value from query', () => {
      const query = { filters: { designation: ['Developer'] } }
      expect(component.getFilterDesignation(query)).toEqual(['Developer'])
    })

    it('getSearchText should return searchText from query or empty string', () => {
      expect(component.getSearchText({ searchText: 'test' })).toBe('test')
      expect(component.getSearchText({})).toBe('')
    })

    it('getSortOrder should return sort object based on sortOrder', () => {
      expect(component.getSortOrder({ sortOrder: 'alphabetical' })).toEqual({ firstName: 'asc' })
      expect(component.getSortOrder({ sortOrder: 'oldest' })).toEqual({ createdDate: 'desc' })
      expect(component.getSortOrder({ sortOrder: 'newest' })).toEqual({ createdDate: 'asc' })
      expect(component.getSortOrder({})).toEqual({ firstName: 'asc' })
    })
  })

  describe('click handlers', () => {
    it('onCreateClick should navigate to create-user route', () => {
      component.onCreateClick()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/users/create-user'])
      expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
    })

    it('onRoleClick should navigate to user details route', () => {
      component.onRoleClick({ userId: 'test-user-id' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/users/test-user-id/details'])
      expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
    })

    it('clickHandler should call appropriate method based on event type', () => {
      const createSpy = jest.spyOn(component, 'onCreateClick')
      const uploadSpy = jest.spyOn(component, 'onUploadClick')

      component.clickHandler({ type: 'createUser' })
      expect(createSpy).toHaveBeenCalled()

      component.clickHandler({ type: 'upload' })
      expect(uploadSpy).toHaveBeenCalled()
    })
  })

  describe('pagination and search', () => {
    it('onPaginateChange should update pageIndex and limit and call filterData', () => {
      const filterDataSpy = jest.spyOn(component, 'filterData')
      component.onPaginateChange({ pageIndex: 2, pageSize: 30, length: 100 } as any)

      expect(component.pageIndex).toBe(2)
      expect(component.limit).toBe(30)
      expect(filterDataSpy).toHaveBeenCalled()
    })

    it('onEnterkySearch should update searchQuery and call filterData', () => {
      const filterDataSpy = jest.spyOn(component, 'filterData')
      component.onEnterkySearch('search term')

      expect(component.searchQuery).toBe('search term')
      expect(filterDataSpy).toHaveBeenCalledWith('search term')
    })
  })

  describe('fetchApprovals', () => {
    it('should call approvalsService with correct parameters when departName exists', () => {
      component.departName = 'test-department'
      component.fetchApprovals()

      expect(mockApprService.getApprovalsList).toHaveBeenCalledWith({
        serviceName: 'profile',
        applicationStatus: 'SEND_FOR_APPROVAL',
        requestType: ['GROUP_CHANGE', 'DESIGNATION_CHANGE'],
        deptName: 'test-department'
      })

      expect(component.pendingApprovals).toEqual([{ id: 'approval1', status: 'SEND_FOR_APPROVAL' }])
    })

    it('should not call approvalsService when departName is empty', () => {
      component.departName = ''
      component.fetchApprovals()
      expect(mockApprService.getApprovalsList).not.toHaveBeenCalled()
    })
  })
})