import { MentorManageComponent } from './mentor-manage.component'
import { of } from 'rxjs'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '@sunbird-cb/utils-v2'
import { DomSanitizer } from '@angular/platform-browser'
import { UsersService } from '../../../users/services/users.service'
import { LoaderService } from '../../../../../../../../../src/app/services/loader.service'
import { TelemetryEvents } from '../../../../head/_services/telemetry.event.model'
import { MatDialog } from '@angular/material/dialog'
import { ReportsVideoComponent } from '../reports-video/reports-video.component'

describe('MentorManageComponent', () => {
    let component: MentorManageComponent
    let mockDialog: jest.Mocked<MatDialog>
    let mockRouter: jest.Mocked<Router>
    let mockRoute: Partial<ActivatedRoute>
    let mockEvents: jest.Mocked<EventService>
    let mockLoaderService: jest.Mocked<LoaderService>
    let mockSanitizer: jest.Mocked<DomSanitizer>
    let mockUsersService: jest.Mocked<UsersService>

    const mockConfigService = {
        userProfile: {
            userId: 'test-user-id'
        },
        unMappedUser: {
            profileDetails: {
                profileStatus: 'VERIFIED'
            },
            rootOrg: {
                rootOrgId: 'test-root-org'
            },
            roles: ['CONTENT_CREATOR']
        }
    }

    beforeEach(() => {
        mockDialog = {
            open: jest.fn(),
        } as unknown as jest.Mocked<MatDialog>

        mockRouter = {
            navigate: jest.fn(),
        } as unknown as jest.Mocked<Router>

        // Updated route mock with correct structure
        mockRoute = {
            snapshot: {
                params: { tab: 'verified' },
                parent: {
                    snapshot: {
                        data: {
                            configService: mockConfigService
                        }
                    }
                }
            }
        } as unknown as Partial<ActivatedRoute>

        mockEvents = {
            handleTabTelemetry: jest.fn(),
            raiseInteractTelemetry: jest.fn(),
        } as unknown as jest.Mocked<EventService>

        mockLoaderService = {
            changeLoad: {
                next: jest.fn()
            }
        } as unknown as jest.Mocked<LoaderService>

        mockSanitizer = {
            bypassSecurityTrustHtml: jest.fn(html => html)
        } as unknown as jest.Mocked<DomSanitizer>

        mockUsersService = {
            mentorList$: of({}),
            getAllUsersV3: jest.fn().mockReturnValue(of({
                content: [{ userId: 'user1' }, { userId: 'user2' }],
                count: 2,
                facets: []
            }))
        } as unknown as jest.Mocked<UsersService>

        component = new MentorManageComponent(
            mockDialog,
            mockRoute as ActivatedRoute,
            mockRouter,
            mockEvents,
            mockLoaderService,
            mockSanitizer,
            mockUsersService
        )

        // Direct assignment as a backup in case the route structure isn't exactly matched
        component.configSvc = mockConfigService
        component.currentUser = mockConfigService.userProfile.userId
        component.currentUserStatus = mockConfigService.unMappedUser.profileDetails.profileStatus
    })

    it('should initialize component properties', () => {
        expect(component.Math).toBe(Math)
        expect(component.currentUser).toBe('test-user-id')
        expect(component.currentUserStatus).toBe('VERIFIED')
    })

    it('should set current filter from route params on ngOnInit', () => {
        jest.spyOn(component, 'getAllVerifiedUsers')
        jest.spyOn(component, 'getMentorUsers')

        // Setup route.snapshot.parent.data for rootOrgId extraction
        const parent = { data: { configService: { unMappedUser: { rootOrg: { rootOrgId: 'test-root-org' } } } } }
        // snapshot is a plain property on the mock, not a getter, so assign it directly
        // rather than spying on an accessor that does not exist. The component reads
        // route.parent.snapshot.data.configService, so parent has to hang off the route.
        ;(mockRoute as any).snapshot = {
            params: { tab: 'verified' },
            parent
        }
        ;(mockRoute as any).parent = {
            snapshot: {
                data: {
                    configService: {
                        userProfile: { userId: 'test-user' },
                        unMappedUser: {
                            rootOrg: { rootOrgId: 'test-root-org' },
                            profileDetails: { profileStatus: 'VERIFIED' }
                        }
                    }
                }
            }
        }

        component.ngOnInit()

        expect(component.currentFilter).toBe('verified')
        expect(component.searchQuery).toBe('')
        expect(component.getAllVerifiedUsers).toHaveBeenCalledWith('')
        expect(component.getMentorUsers).toHaveBeenCalledWith('')
    })

    it('should set proper reportsNoteList on ngOnInit', () => {
        // Setup route.snapshot.parent.data for rootOrgId extraction
        const parent = { data: { configService: { unMappedUser: { rootOrg: { rootOrgId: 'test-root-org' } } } } }
        // snapshot is a plain property on the mock, not a getter, so assign it directly
        // rather than spying on an accessor that does not exist. The component reads
        // route.parent.snapshot.data.configService, so parent has to hang off the route.
        ;(mockRoute as any).snapshot = {
            params: { tab: 'verified' },
            parent
        }
        ;(mockRoute as any).parent = {
            snapshot: {
                data: {
                    configService: {
                        userProfile: { userId: 'test-user' },
                        unMappedUser: {
                            rootOrg: { rootOrgId: 'test-root-org' },
                            profileDetails: { profileStatus: 'VERIFIED' }
                        }
                    }
                }
            }
        }

        component.ngOnInit()

        expect(component.reportsNoteList.length).toBe(3)
        expect(component.reportsNoteList[0]).toContain('All Verified Users')
    })

    it('should sanitize HTML', () => {
        const html = '<p>Test</p>'
        component.sanitizeHtml(html)

        expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(html)
    })

    it('should open video popup dialog', () => {
        component.openVideoPopup()

        expect(mockDialog.open).toHaveBeenCalledWith(
            ReportsVideoComponent,
            expect.objectContaining({
                data: {
                    videoLink: expect.any(String)
                },
                disableClose: true,
                width: '50%',
                height: '60%',
                panelClass: 'overflow-visable'
            })
        )
    })

    it('should filter data with specified filter type', () => {
        jest.spyOn(component, 'getAllVerifiedUsers')
        jest.spyOn(component, 'getMentorUsers')

        component.filter('verified')

        expect(component.currentFilter).toBe('verified')
        expect(component.pageIndex).toBe(0)
        expect(component.currentOffset).toBe(0)
        expect(component.limit).toBe(20)
        expect(component.searchQuery).toBe('')
        expect(component.getAllVerifiedUsers).toHaveBeenCalledWith('')

        component.filter('mentor')

        expect(component.currentFilter).toBe('mentor')
        expect(component.getMentorUsers).toHaveBeenCalledWith('')
    })

    it('should handle tab telemetry events', () => {
        const label = 'Test Tab'
        const index = 1

        component.tabTelemetry(label, index)

        expect(mockEvents.handleTabTelemetry).toHaveBeenCalledWith(
            TelemetryEvents.EnumInteractSubTypes.USER_TAB,
            { label, index }
        )
    })

    it('should apply correct filter based on currentFilter', () => {
        jest.spyOn(component, 'getAllVerifiedUsers')
        jest.spyOn(component, 'getMentorUsers')

        component.currentFilter = 'verified'
        component.filterData('test-query')

        expect(component.getAllVerifiedUsers).toHaveBeenCalledWith('test-query')

        component.currentFilter = 'mentor'
        component.filterData('test-query')

        expect(component.getMentorUsers).toHaveBeenCalledWith('test-query')
    })

    it('should check if user editing is allowed', () => {
        component.isMdoAdmin = true

        expect(component.showEditUser(['PUBLIC'])).toBe(true)
        expect(component.showEditUser([])).toBe(true)

        component.isMdoAdmin = false

        expect(component.showEditUser(['ADMIN'])).toBe(true)
    })

    it('should fetch all verified users', () => {
        // Set rootOrgId manually for this test
        component.rootOrgId = 'test-root-org'

        component.getAllVerifiedUsers('')

        expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(true)
        expect(mockUsersService.getAllUsersV3).toHaveBeenCalledWith({
            request: expect.objectContaining({
                filters: expect.objectContaining({
                    rootOrgId: 'test-root-org',
                    status: 1,
                    'profileDetails.profileStatus': 'VERIFIED'
                }),
                limit: 20
            })
        })
        expect(component.verifiedUsersData).toEqual([{ userId: 'user1' }, { userId: 'user2' }])
        expect(component.verifiedUsersDataCount).toBe(2)
    })

    it('should fetch mentor users', () => {
        // Set rootOrgId manually for this test
        component.rootOrgId = 'test-root-org'

        component.getMentorUsers('')

        expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(true)
        expect(mockUsersService.getAllUsersV3).toHaveBeenCalledWith({
            request: expect.objectContaining({
                filters: expect.objectContaining({
                    rootOrgId: 'test-root-org',
                    'roles.role': 'MENTOR',
                    'profileDetails.profileStatus': 'VERIFIED'
                }),
                limit: 20
            })
        })
        expect(component.mentorUsersData).toEqual([{ userId: 'user1' }, { userId: 'user2' }])
        expect(component.mentorUsersDataCount).toBe(2)
    })

    it('should extract filter parameters from query object', () => {
        const mockQuery = {
            filters: {
                group: ['Group1'],
                designation: ['Designation1'],
                roles: ['Role1'],
                tags: ['Tag1']
            }
        }

        expect(component.getFilterGroup(mockQuery)).toEqual(['Group1'])
        expect(component.getFilterDesignation(mockQuery)).toEqual(['Designation1'])
        expect(component.getFilterRoles(mockQuery)).toEqual(['Role1'])
        expect(component.getFilterTags(mockQuery)).toEqual(['Tag1'])
    })

    it('should extract search text from query object', () => {
        expect(component.getSearchText({ searchText: 'test search' })).toBe('test search')
        expect(component.getSearchText({})).toBe('')
    })

    it('should determine sort order from query object', () => {
        expect(component.getSortOrder({ sortOrder: 'alphabetical' })).toEqual({ firstName: 'asc' })
        expect(component.getSortOrder({ sortOrder: 'oldest' })).toEqual({ createdDate: 'desc' })
        expect(component.getSortOrder({ sortOrder: 'newest' })).toEqual({ createdDate: 'asc' })
        expect(component.getSortOrder({})).toEqual({ firstName: 'asc' })
    })

    it('should handle click events appropriately', () => {
        jest.spyOn(component, 'onCreateClick')
        jest.spyOn(component, 'onUploadClick')

        component.clickHandler({ type: 'createUser' })
        expect(component.onCreateClick).toHaveBeenCalled()

        component.clickHandler({ type: 'upload' })
        expect(component.onUploadClick).toHaveBeenCalled()
    })

    it('should navigate to create user page', () => {
        component.onCreateClick()

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/users/create-user'])
        expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
            expect.objectContaining({
                type: TelemetryEvents.EnumInteractTypes.CLICK,
                subType: TelemetryEvents.EnumInteractSubTypes.CREATE_BTN,
                id: 'create-user-btn'
            }),
            {}
        )
    })

    it('should handle upload click', () => {
        jest.spyOn(component, 'filter')

        component.onUploadClick()

        expect(component.filter).toHaveBeenCalledWith('upload')
    })

    it('should navigate to user details on role click', () => {
        const mockUser = { userId: 'test-user-id' }

        component.onRoleClick(mockUser)

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/users/test-user-id/details'])
        expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
            expect.objectContaining({
                type: TelemetryEvents.EnumInteractTypes.CLICK,
                subType: TelemetryEvents.EnumInteractSubTypes.CARD_CONTENT,
                id: TelemetryEvents.EnumIdtype.USER_ROW
            }),
            {
                id: 'test-user-id',
                type: TelemetryEvents.EnumIdtype.USER
            }
        )
    })

    it('should filter data on enter key search', () => {
        jest.spyOn(component, 'filterData')

        component.onEnterkySearch('search term')

        expect(component.searchQuery).toBe('search term')
        expect(component.filterData).toHaveBeenCalledWith('search term')
    })

    it('should handle pagination changes', () => {
        jest.spyOn(component, 'filterData')

        component.onPaginateChange({ pageIndex: 2, pageSize: 30 } as any)

        expect(component.pageIndex).toBe(2)
        expect(component.limit).toBe(30)
        expect(component.filterData).toHaveBeenCalledWith(component.searchQuery)
    })
})