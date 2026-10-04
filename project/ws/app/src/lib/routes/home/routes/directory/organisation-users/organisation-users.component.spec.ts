import { Subject } from 'rxjs'
import { OrganisationUsersComponent } from './organisation-users.component'

describe('OrganisationUsersComponent', () => {
  let component: OrganisationUsersComponent
  let mockActivatedRoute: any
  let mockRouter: any
  let queryParamsSubject: Subject<any>

  beforeEach(() => {
    queryParamsSubject = new Subject<any>()

    mockActivatedRoute = {
      snapshot: {
        data: {},
        queryParams: { roleId: 'org-123', orgName: 'Test Org' },
      },
      queryParams: queryParamsSubject.asObservable(),
    }

    mockRouter = {
      navigate: jest.fn(),
    }

    component = new OrganisationUsersComponent(
      mockActivatedRoute,
      mockRouter,
      // Only changeLoaderState is called, and only for its side effect.
      { changeLoaderState: jest.fn() } as any,
      // ngOnInit reads the parent org off this service.
      { getOrgData: jest.fn().mockReturnValue({}) } as any,
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit()', () => {
    it('should set orgData and orgDataLoaded when resolver returns valid data without error', () => {
      mockActivatedRoute.snapshot.data = { orgUsersData: { orgData: { id: 'org-123' }, parentOrgData: null, error: null } }

      component.ngOnInit()

      expect(component.orgData).toEqual(mockActivatedRoute.snapshot.queryParams)
      expect(component.orgDataLoaded).toBe(true)
    })

    it('should not set orgDataLoaded when resolver returns error', () => {
      mockActivatedRoute.snapshot.data = { orgUsersData: { orgData: null, parentOrgData: null, error: 'No organisationId provided' } }

      component.ngOnInit()

      expect(component.orgDataLoaded).toBe(false)
    })

    it('should not set orgDataLoaded when orgUsersData is missing from resolver', () => {
      mockActivatedRoute.snapshot.data = {}

      component.ngOnInit()

      expect(component.orgDataLoaded).toBe(false)
    })

    it('should initialise tabs array with 6 tabs', () => {
      component.ngOnInit()

      expect(component.tabs.length).toBe(6)
      expect(component.tabs[0]).toEqual({ name: 'Users', value: 'users' })
      expect(component.tabs[1]).toEqual({ name: 'Roles and access', value: 'rolesAndAccess' })
      expect(component.tabs[2]).toEqual({ name: 'Mentor Management', value: 'mentorManagement' })
      expect(component.tabs[3]).toEqual({ name: 'Designation Master', value: 'designationMaster' })
      expect(component.tabs[4]).toEqual({ name: 'User Onboarding', value: 'userOnboarding' })
      expect(component.tabs[5]).toEqual({ name: 'User Transfer', value: 'userTransfer' })
    })

    it('should update selectedTabIndex when queryParams emits a known tab value', () => {
      component.ngOnInit()

      queryParamsSubject.next({ tab: 'rolesAndAccess' })

      expect(component.selectedTabIndex).toBe(1)
    })

    it('should update selectedTabIndex to correct index for designationMaster tab', () => {
      component.ngOnInit()

      queryParamsSubject.next({ tab: 'designationMaster' })

      expect(component.selectedTabIndex).toBe(3)
    })

    it('should not update selectedTabIndex when tab param is absent', () => {
      component.ngOnInit()
      component.selectedTabIndex = 2

      queryParamsSubject.next({ someOtherParam: 'value' })

      expect(component.selectedTabIndex).toBe(2)
    })

    it('should not update selectedTabIndex when tab value is not found in tabs', () => {
      component.ngOnInit()
      component.selectedTabIndex = 0

      queryParamsSubject.next({ tab: 'unknownTab' })

      expect(component.selectedTabIndex).toBe(0)
    })
  })

  describe('getCurrentTabDetails()', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should return the tab at the current selectedTabIndex', () => {
      component.selectedTabIndex = 0

      const result: any = component.getCurrentTabDetails()

      expect(result).toEqual({ name: 'Users', value: 'users' })
    })

    it('should return the correct tab when selectedTabIndex is non-zero', () => {
      component.selectedTabIndex = 2

      const result: any = component.getCurrentTabDetails()

      expect(result).toEqual({ name: 'Mentor Management', value: 'mentorManagement' })
    })

    it('should return null when tabs array is empty', () => {
      component.tabs = []

      const result: any = component.getCurrentTabDetails()

      expect(result).toBeNull()
    })

    it('should return null when selectedTabIndex is out of bounds', () => {
      component.selectedTabIndex = 99

      const result: any = component.getCurrentTabDetails()

      expect(result).toBeNull()
    })
  })

  describe('onTabChange()', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should set selectedTabIndex', () => {
      component.onTabChange(2)

      expect(component.selectedTabIndex).toBe(2)
    })

    it('should navigate with the selected tab value as query param', () => {
      component.onTabChange(1)

      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        relativeTo: mockActivatedRoute,
        queryParams: { tab: 'rolesAndAccess' },
        queryParamsHandling: 'merge',
      })
    })

    it('should navigate with userOnboarding tab value', () => {
      component.onTabChange(4)

      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        relativeTo: mockActivatedRoute,
        queryParams: { tab: 'userOnboarding' },
        queryParamsHandling: 'merge',
      })
    })

    it('should not call navigate when tab index is out of bounds', () => {
      component.onTabChange(99)

      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })

    it('should not call navigate when tab has no value property', () => {
      component.tabs = [{ name: 'No Value Tab' }]
      component.onTabChange(0)

      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })
  })

  describe('onCreateUser()', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should navigate to userOnboarding tab when event is truthy', () => {
      component.onCreateUser({ someEvent: true })

      expect(mockRouter.navigate).toHaveBeenCalledWith([], expect.objectContaining({
        queryParams: { tab: 'userOnboarding' },
      }))
    })

    it('should not navigate when event is falsy', () => {
      component.onCreateUser(null)

      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })

    it('should not navigate when event is undefined', () => {
      component.onCreateUser(undefined)

      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })
  })

  describe('showDesTab()', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should navigate to designationMaster tab when event is truthy', () => {
      component.showDesTab(true)

      expect(mockRouter.navigate).toHaveBeenCalledWith([], expect.objectContaining({
        queryParams: { tab: 'designationMaster' },
      }))
    })

    it('should not navigate when event is falsy', () => {
      component.showDesTab(false)

      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })

    it('should not navigate when event is null', () => {
      component.showDesTab(null)

      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })
  })

  describe('onUserCreated()', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should navigate to users tab when event is truthy', () => {
      component.onUserCreated({ userId: 'new-user' })

      expect(mockRouter.navigate).toHaveBeenCalledWith([], expect.objectContaining({
        queryParams: { tab: 'users' },
      }))
    })

    it('should not navigate when event is falsy', () => {
      component.onUserCreated(null)

      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })

    it('should not navigate when event is undefined', () => {
      component.onUserCreated(undefined)

      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })
  })
})
